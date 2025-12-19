
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

const LOCAL_DATA = {
    profiles: [{ id: 'local1', name: 'Mobile Data', theme: 'red' }],
    workouts: { 'local1': [{ id: 'w1', name: 'Leg Day' }] }
};

async function main() {
    // 0. Ensure Server Health
    try { await fetch(`${BASE_URL}/api/health`); }
    catch { console.error("Server 3002 not running"); process.exit(1); }

    // 1. Register New User
    console.log("Registering NewKiki...");
    const reg = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `NewKiki_${Date.now()}`, password: 'p' })
    });
    if (!reg.ok) throw new Error("Register failed");
    const { token } = await reg.json();
    console.log("Registered. Token received.");

    // 2. Simulate Client Sync Check (GET)
    console.log("Fetching Initial Sync Data...");
    const syncGet = await fetch(`${BASE_URL}/api/sync`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data: serverData } = await syncGet.json();

    // 3. Client Logic Simulation
    if (!serverData || Object.keys(serverData).length === 0) {
        console.log("Server data is empty. Pushing Local Data...");
        const push = await fetch(`${BASE_URL}/api/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: LOCAL_DATA })
        });
        if (!push.ok) throw new Error(`Push failed: ${push.status}`);
        console.log("Push success.");
    } else {
        console.error("Server data not empty? unexpected for new user.");
        process.exit(1);
    }

    // 4. Verify Server Has Data
    console.log("Verifying Server Data...");
    const verifyGet = await fetch(`${BASE_URL}/api/sync`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data: finalData } = await verifyGet.json();

    if (finalData.profiles[0].name === 'Mobile Data') {
        console.log("SUCCESS: Local data safely migrated to new account!");
    } else {
        console.error("FAILURE: Data mismatch", finalData);
        process.exit(1);
    }
}

main().catch(console.error);
