const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      data JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT,
      results JSON,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    console.log('Database initialized');
}

async function getDocuments() {
    const result = await db.all('SELECT data FROM documents ORDER BY created_at DESC');
    return result.map(row => JSON.parse(row.data));
}

async function addDocument(doc) {
    await db.run(
        'INSERT OR REPLACE INTO documents (id, data, created_at) VALUES (?, ?, ?)',
        doc.id,
        JSON.stringify(doc),
        doc.processedAt || new Date().toISOString()
    );
}

async function deleteDocument(id) {
    await db.run('DELETE FROM documents WHERE id = ?', id);
}

// Search History Functions
async function getSearchHistory() {
    const result = await db.all('SELECT * FROM search_history ORDER BY timestamp DESC LIMIT 20');
    return result.map(row => ({
        ...row,
        results: JSON.parse(row.results)
    }));
}

async function addSearchHistory(query, results) {
    await db.run(
        'INSERT INTO search_history (query, results) VALUES (?, ?)',
        query,
        JSON.stringify(results)
    );
}

async function clearSearchHistory() {
    await db.run('DELETE FROM search_history');
}

module.exports = { initDB, getDocuments, addDocument, deleteDocument, getSearchHistory, addSearchHistory, clearSearchHistory };
