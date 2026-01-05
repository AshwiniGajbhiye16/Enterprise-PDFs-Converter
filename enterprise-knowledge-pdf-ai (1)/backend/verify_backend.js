
try {
    const fetch = require('node-fetch'); // Check if available, otherwise use http
    // Actually, I can't rely on node-fetch being available in the environment easily without install.
    // I will use built-in http or curl.
} catch (e) { }

// Let's use a simple node script with built-in http
const http = require('http');

function postRequest(data) {
    const postData = JSON.stringify(data);
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/documents',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

function getRequest() {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/documents',
        method: 'GET'
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function verify() {
    console.log('Verifying Backend...');

    // 1. Initial Get
    try {
        const initial = await getRequest();
        console.log('Initial GET:', initial.statusCode, initial.body);
    } catch (e) {
        console.log("Server might not be ready yet", e.message);
    }

    // 2. Post Data
    const doc = {
        id: "test-doc-1",
        fileName: "test.pdf",
        metadata: { title: "Test Doc", category: "Test" },
        sections: [],
        tables: [],
        images: [],
        toc: [],
        processedAt: new Date().toISOString()
    };

    const postRes = await postRequest(doc);
    console.log('POST:', postRes.statusCode, postRes.body);

    // 3. Get Data
    const finalRes = await getRequest();
    console.log('Final GET:', finalRes.statusCode, finalRes.body);

    const body = JSON.parse(finalRes.body);
    if (body.find(d => d.id === 'test-doc-1')) {
        console.log('SUCCESS: Document found in storage.');
    } else {
        console.log('FAILURE: Document not found.');
        process.exit(1);
    }
}

verify();
