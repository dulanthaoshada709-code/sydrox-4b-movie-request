const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Vercel Settings වල MONGODB_URI ඇතුළත් කිරීමට අමතක කරන්න එපා
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        return client.db('movieDB').collection('requests');
    } catch (e) {
        console.error("Connection error", e);
        return null;
    }
}

// 1. සියලුම Requests ලබා ගැනීම
app.get('/api/requests', async (req, res) => {
    const collection = await connectDB();
    if (!collection) return res.status(500).send("DB Connection Error");
    const requests = await collection.find({}).toArray();
    res.json(requests);
});

// 2. අලුත් Request එකක් ඇතුළත් කිරීම
app.post('/api/requests', async (req, res) => {
    const collection = await connectDB();
    if (!collection) return res.status(500).send("DB Connection Error");
    const result = await collection.insertOne(req.body);
    res.status(201).json(result);
});

// 3. Status එක වෙනස් කිරීම
app.patch('/api/requests', async (req, res) => {
    const collection = await connectDB();
    if (!collection) return res.status(500).send("DB Connection Error");
    const { id } = req.query;
    const { status } = req.body;
    const result = await collection.updateOne({ id: id }, { $set: { status: status } });
    res.json(result);
});

module.exports = app;
