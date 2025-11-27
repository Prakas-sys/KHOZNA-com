import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to load handler from api directory
const loadHandler = async (filePath) => {
    try {
        const module = await import(filePath);
        return module.default;
    } catch (error) {
        console.error(`Failed to load handler from ${filePath}:`, error);
        return null;
    }
};

// API Routes
app.post('/api/send-edit-request', async (req, res) => {
    const handler = await loadHandler('./api/send-edit-request.js');
    if (handler) {
        await handler(req, res);
    } else {
        res.status(500).json({ error: 'Internal Server Error: Handler not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
