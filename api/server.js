const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectDB() {
    await client.connect();
    return client.db('movieDB').collection('requests');
}

app.get('/api/requests', async (req, res) => {
    const col = await connectDB();
    const data = await col.find({}).sort({ requestedAt: -1 }).toArray();
    res.json(data);
});

app.post('/api/requests', async (req, res) => {
    const col = await connectDB();
    const result = await col.insertOne(req.body);
    res.status(201).json(result);
});

// Status එක වෙනස් කිරීම (completed හෝ unfound ලෙස)
app.patch('/api/requests', async (req, res) => {
    const col = await connectDB();
    const { id } = req.query;
    const { status } = req.body;
    await col.updateOne({ id: id }, { $set: { status: status } });
    res.json({ success: true });
});

module.exports = app;
