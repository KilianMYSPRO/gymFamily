/* eslint-env node */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const http = require('http');
const setupSocket = require('./socket');
const authRoutes = require('./routes/auth');
const prisma = require('./prisma/client');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 3002;

// In test environment, use a fallback secret. In production, require the env var.
const isTest = process.env.NODE_ENV === 'test';
if (!process.env.JWT_SECRET && !isTest) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}

const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.path}`);
    next();
});
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for sync

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Use Auth Routes
app.use('/api/auth', authRoutes);

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
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server, prisma };
