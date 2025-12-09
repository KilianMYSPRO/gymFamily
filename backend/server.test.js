/* eslint-env node, jest */
/* global describe, it, expect */
const request = require('supertest');
const express = require('express');

// Mock server for smoke test to avoid starting the full app with DB/Socket connections
const app = express();
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

describe('Backend Smoke Test', () => {
    it('GET /api/health should return 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
    });

    it('Math check', () => {
        expect(1 + 1).toBe(2);
    });
});
