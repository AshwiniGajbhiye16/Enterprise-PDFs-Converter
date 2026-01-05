const http = require('http');

function request(method, path, body = null) {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api' + path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body ? Buffer.byteLength(JSON.stringify(body)) : 0
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verify() {
    console.log('Verifying History API...');

    // 1. Clear History
    await request('DELETE', '/history');
    console.log('Cleared History');

    // 2. Post History
    const item = {
        query: "test query",
        results: [{ fileName: "abc.pdf", score: 0.9, snippet: "xyz" }]
    };
    const postRes = await request('POST', '/history', item);
    console.log('POST History:', postRes.statusCode);

    // 3. Get History
    const getRes = await request('GET', '/history');
    console.log('GET History:', getRes.statusCode, getRes.body);

    if (getRes.statusCode === 200 && getRes.body.includes('test query')) {
        console.log('SUCCESS: History saved and retrieved.');
    } else {
        console.log('FAILURE');
        process.exit(1);
    }
}

verify();
