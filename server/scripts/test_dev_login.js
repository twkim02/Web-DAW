const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/dev_login?returnTo=/test-success',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    // Expect redirect (302) to localhost:5173/test-success
    if (res.statusCode === 302 && res.headers.location.includes('localhost:5173/test-success')) {
        console.log('✅ PASS: Dev Login redirected correctly to client.');
    } else {
        console.error(`❌ FAIL: Unexpected status or location. Location: ${res.headers.location}`);
    }
});

req.on('error', (e) => {
    console.error(`❌ FAIL: Problem with request: ${e.message}`);
});

req.end();
