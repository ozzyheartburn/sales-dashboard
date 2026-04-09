// Simple Node.js Express server for backend operations
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Example MongoDB connection (update URI in .env)
// const { MongoClient } = require('mongodb');
// const client = new MongoClient(process.env.MONGODB_URI);
// app.get('/api/data', async (req, res) => {
//   await client.connect();
//   const db = client.db('your-db');
//   const data = await db.collection('your-collection').find({}).toArray();
//   res.json(data);
// });

// Example n8n workflow trigger endpoint
app.post('/api/research', async (req, res) => {
  // Call n8n webhook or handle workflow logic here
  res.json({ success: true, received: req.body });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
