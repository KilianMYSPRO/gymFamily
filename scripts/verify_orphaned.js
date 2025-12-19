/* eslint-env node */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
    // 0. Ensure Server Connectivity
    try {
        await fetch(`${BASE_URL}/api/health`);
    } catch {
        console.error("Please run the server on port 3002 first!");
        process.exit(1);
    }

    // 1. Register
    const username = `orphaned_${Date.now()}`;
    const password = 'password123';
    console.log(`Registering ${username}...`);

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, securityQuestion: 'q', securityAnswer: 'a' })
    });

    if (!regRes.ok) {
        console.error("Registration failed");
        process.exit(1);
    }

    const { token, user } = await regRes.json();
    console.log('Got token for user:', user.id);

    // 2. Delete User from DB (Simulate data wipe)
    console.log('Deleting user from database...');
    await prisma.userData.deleteMany({ where: { userId: user.id } }); // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    console.log('User deleted.');

    // 3. Try access with Token
    console.log('Attempting push with orphaned token...');
    const res = await fetch(`${BASE_URL}/api/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: { profiles: [] } })
    });

    console.log('Status:', res.status);
    console.log('Body:', await res.text());
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
