import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
    // Content Security Policy to allow the specific inline script hash
    res.setHeader(
        'Content-Security-Policy',
        "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' 'sha256-kPx0AsF0oz2kKiZ875xSvv693TBHkQ/0SkMJZnnNpnQ='"
    );
    next();
});
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
