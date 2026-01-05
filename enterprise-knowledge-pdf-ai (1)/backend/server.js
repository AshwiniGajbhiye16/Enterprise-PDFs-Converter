const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initDB, getDocuments, addDocument, deleteDocument, getSearchHistory, addSearchHistory, clearSearchHistory } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for large PDF data

// Initialize Database
initDB();

// Routes
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await getDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const doc = req.body;
    if (!doc.id || !doc.fileName) {
      return res.status(400).json({ error: 'Invalid document structure' });
    }
    await addDocument(doc);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDocument(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search History Routes
app.get('/api/history', async (req, res) => {
  try {
    const history = await getSearchHistory();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const { query, results } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    await addSearchHistory(query, results || []);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await clearSearchHistory();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
