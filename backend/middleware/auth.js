/* eslint-env node */
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const isTest = process.env.NODE_ENV === 'test';
const JWT_SECRET = process.env.JWT_SECRET || (isTest ? 'test-secret-for-jest' : null);

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

module.exports = { authenticateToken, JWT_SECRET };
