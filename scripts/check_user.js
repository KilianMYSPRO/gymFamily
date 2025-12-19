
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    console.log(`Listing all users...`);
    try {
        const users = await prisma.user.findMany();
        if (users.length > 0) {
            const out = JSON.stringify(users, null, 2);
            fs.writeFileSync('all_users.txt', out);
            console.log(`Dumped ${users.length} users to all_users.txt`);
            // Also print names to console for quick check
            console.log("Usernames:", users.map(u => u.username).join(", "));
        } else {
            console.log('No users found in database.');
        }
    } catch (e) {
        console.error("Error finding users:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
