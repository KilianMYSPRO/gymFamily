/* eslint-env node, jest */
/* global describe, it, expect, beforeAll, afterAll */
const request = require('supertest');
const { app, prisma } = require('./server');

describe('Backend Integration Tests', () => {
    let authToken;
    const testUser = {
        username: `testuser_${Date.now()}`,
        password: 'password123',
        securityQuestion: 'Pet?',
        securityAnswer: 'Dog'
    };

    beforeAll(async () => {
        // Clean up test user if exists
        try {
            const existing = await prisma.user.findUnique({ where: { username: testUser.username } });
            if (existing) {
                await prisma.userData.deleteMany({ where: { userId: existing.id } });
                await prisma.user.delete({ where: { id: existing.id } });
            }
        } catch (e) {
            console.log('Cleanup Setup Warning:', e.message);
        }
    });

    afterAll(async () => {
        // Cleanup
        try {
            const existing = await prisma.user.findUnique({ where: { username: testUser.username } });
            if (existing) {
                await prisma.userData.deleteMany({ where: { userId: existing.id } });
                await prisma.user.delete({ where: { id: existing.id } });
            }
            await prisma.$disconnect();
        } catch (e) {
            console.log('Cleanup Teardown Warning:', e.message);
        }
    });

    it('health check should pass', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('username', testUser.username);
    });

    it('should login with created user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: testUser.password
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        authToken = res.body.token;
    });

    it('should fail login with existing username but wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
    });

    it('should sync data (authenticated)', async () => {
        const syncData = {
            workouts: { id: 'w1', name: 'Test Workout' }
        };

        const res = await request(app)
            .post('/api/sync')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ data: syncData });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
    });

    it('should retrieve synced data (authenticated)', async () => {
        const res = await request(app)
            .get('/api/sync')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('workouts');
        expect(res.body.data.workouts).toHaveProperty('name', 'Test Workout');
    });

    it('should deny sync without token', async () => {
        const res = await request(app).get('/api/sync');
        expect(res.statusCode).toEqual(401);
    });
});
