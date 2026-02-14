import express from 'express';
import cors from 'cors';
import handler from './api/generate.js';
import suggestHandler from './api/suggest.js';
import pricesHandler from './api/prices.js';

const app = express();
app.use(cors());
app.use(express.json());

// Adapter les handlers Vercel pour Express
app.post('/api/generate', (req, res) => handler(req, res));
app.post('/api/suggest', (req, res) => suggestHandler(req, res));
app.post('/api/prices', (req, res) => pricesHandler(req, res));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
