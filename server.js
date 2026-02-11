import express from 'express';
import cors from 'cors';
import handler from './api/generate.js';

const app = express();
app.use(cors());
app.use(express.json());

// Adapter le handler Vercel pour Express
app.post('/api/generate', (req, res) => handler(req, res));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
