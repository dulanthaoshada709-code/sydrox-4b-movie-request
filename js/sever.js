const { MongoClient } = require('mongodb');

// MongoDB Connection String එක Vercel Environment Variables වල MONGODB_URI ලෙස ඇතුළත් කරන්න
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await client.connect();
        const db = client.db('movieDB');
        const collection = db.collection('requests');

        // 1. සියලුම ඉල්ලීම් ලබා ගැනීම (GET)
        if (req.method === 'GET') {
            const requests = await collection.find({}).toArray();
            return res.status(200).json(requests);
        }

        // 2. අලුත් ඉල්ලීමක් ඇතුළත් කිරීම (POST)
        if (req.method === 'POST') {
            const newRequest = req.body;
            const result = await collection.insertOne(newRequest);
            return res.status(201).json(result);
        }

        // 3. තත්වය යාවත්කාලීන කිරීම (PATCH)
        if (req.method === 'PATCH') {
            const { id } = req.query;
            const { status } = req.body;
            const result = await collection.updateOne(
                { id: id },
                { $set: { status: status } }
            );
            return res.status(200).json(result);
        }

        return res.status(405).json({ message: 'Method Not Allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
