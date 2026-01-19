const https = require('https');

const url = 'https://web-daw-database.s3.ap-southeast-2.amazonaws.com/uploads/1768852739017-665433868.mp3';

console.log('Testing access to:', url);

https.get(url, (res) => {
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
