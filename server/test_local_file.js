const http = require('http');

const url = 'http://localhost:3001/uploads/1768903379971-510690999.mp3';

console.log('Testing access to:', url);

http.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    if (res.statusCode === 200) {
        console.log('Success! File is accessible.');
    } else {
        console.error('Failed to access file.');
    }
}).on('error', (e) => {
    console.error('Error:', e);
});
