const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, restrict in prod
        methods: ["GET", "POST"]
    }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'duogym-secret-key-change-me';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for sync

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('partner_joined', { id: socket.id });
    });

    socket.on('workout_update', (data) => {
        // data should contain: roomId, exerciseName, sets, reps, weight, etc.
        const { roomId, ...workoutData } = data;
        socket.to(roomId).emit('workout_update', workoutData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ... (Auth Routes and Sync Routes remain unchanged) ...


app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedAnswer = req.body.securityAnswer ? await bcrypt.hash(req.body.securityAnswer.toLowerCase(), 10) : null;

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                securityQuestion: req.body.securityQuestion,
                securityAnswer: hashedAnswer
            }
        });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/get-security-question/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.securityQuestion) {
            return res.status(400).json({ error: 'No security question set for this user' });
        }

        res.json({ question: user.securityQuestion });
    } catch (error) {
        console.error('Get security question error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { username, securityAnswer, newPassword } = req.body;

        if (!username || !securityAnswer || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !user.securityAnswer) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const isAnswerValid = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswer);

        if (!isAnswerValid) {
            return res.status(401).json({ error: 'Incorrect security answer' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/update-security', authenticateToken, async (req, res) => {
    try {
        const { securityQuestion, securityAnswer } = req.body;

        if (!securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                securityQuestion,
                securityAnswer: hashedAnswer
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Update security error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sync Routes
app.get('/api/sync', authenticateToken, async (req, res) => {
    try {
        const userData = await prisma.userData.findMany({
            where: { userId: req.user.id }
        });

        const responseData = {};
        userData.forEach(item => {
            try {
                responseData[item.type] = JSON.parse(item.data);
            } catch (e) {
                console.error(`Failed to parse data for ${item.type}`, e);
            }
        });

        res.json({ data: responseData, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Sync fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/sync', authenticateToken, async (req, res) => {
    try {
        const { data } = req.body; // Expecting { profiles: [...], workouts: {...}, ... }

        if (!data) return res.status(400).json({ error: 'No data provided' });

        const operations = Object.entries(data).map(([type, content]) => {
            return prisma.userData.upsert({
                where: {
                    userId_type: {
                        userId: req.user.id,
                        type
                    }
                },
                update: {
                    data: JSON.stringify(content)
                },
                create: {
                    userId: req.user.id,
                    type,
                    data: JSON.stringify(content)
                }
            });
        });

        await prisma.$transaction(operations);
        res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Sync save error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
