const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Use same logic as server.js - fallback only in test environment
const isTest = process.env.NODE_ENV === 'test';
const JWT_SECRET = process.env.JWT_SECRET || (isTest ? 'test-secret-for-jest' : null);
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Middleware to verify JWT (copied for local use if needed, but usually this is for protected routes. 
// The auth routes (login/register) don't strictly need it unless for specific updates)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        try {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            if (!dbUser) {
                return res.sendStatus(401);
            }
            req.user = user;
            next();
        } catch (dbError) {
            console.error('Auth verification error:', dbError);
            res.sendStatus(500);
        }
    });
};


router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[AUTH] Login attempt for user: ${username}`);
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

router.get('/get-security-question/:username', async (req, res) => {
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

router.post('/reset-password', async (req, res) => {
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

router.post('/update-security', authenticateToken, async (req, res) => {
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

module.exports = router;
