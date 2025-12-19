
const http = require('http');

const data = JSON.stringify({
    username: 'Kiki',
    password: 'dummyPassword123'
});

const ports = [3000, 3002];

ports.forEach(port => {
    const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`[Port ${port}] Status: ${res.statusCode}`);
            // console.log(`[Port ${port}] Body: ${body}`);
        });
    });
    req.on('error', e => console.log(`[Port ${port}] Error: ${e.message}`));
    req.write(data);
    req.end();
});
