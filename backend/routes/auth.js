const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/client');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: () => process.env.NODE_ENV === 'test',
});


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

router.post('/login', authLimiter, async (req, res) => {
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

router.post('/reset-password', authLimiter, async (req, res) => {
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
