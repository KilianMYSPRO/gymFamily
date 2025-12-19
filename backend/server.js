/* eslint-env node */
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const http = require('http');
const setupSocket = require('./socket');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
setupSocket(server);

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'duogym-secret-key-change-me';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for sync

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Use Auth Routes
app.use('/api/auth', authRoutes);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        try {
            // Verify user exists in DB to prevent orphaned tokens
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            if (!dbUser) {
                return res.sendStatus(401); // Invalid/Deleted user
            }
            req.user = user;
            next();
        } catch (dbError) {
            console.error('Auth verification error:', dbError);
            res.sendStatus(500);
        }
    });
};

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
        res.status(500).json({
            error: 'Sync save failed',
            details: error.message,
            code: error.code,
            meta: error.meta
        });
    }
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server, prisma };
