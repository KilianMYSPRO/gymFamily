
const http = require('http');

const ports = [3000, 3001, 3002, 8080, 8081];

ports.forEach(port => {
    const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/api/test', // Just a probe
        method: 'GET',
        timeout: 2000
    }, (res) => {
        console.log(`Port ${port} is ALIVE. Status: ${res.statusCode}`);
    });

    req.on('error', (e) => {
        // console.log(`Port ${port} is dead.`);
    });

    req.end();
});
