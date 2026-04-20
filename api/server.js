const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'movieRequestDB'; // 👈 Database name එක හරියට

const client = new MongoClient(uri);

async function connectDB() {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db(dbName).collection('requests');
}

// GET - All requests
app.get('/api/requests', async (req, res) => {
    try {
        const col = await connectDB();
        const data = await col.find({}).sort({ requestedAt: -1 }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - New request
app.post('/api/requests', async (req, res) => {
    try {
        const col = await connectDB();
        const result = await col.insertOne(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ FIXED: PATCH - Update status (using :id parameter)
app.patch('/api/requests/:id', async (req, res) => {
    try {
        const col = await connectDB();
        const { id } = req.params; // 👈 req.params, not req.query
        const { status } = req.body;
        
        const result = await col.updateOne(
            { id: id }, 
            { $set: { status: status } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ success: true, modified: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
    res.json({ message: 'Movie Request API is running' });
});

module.exports = app;
