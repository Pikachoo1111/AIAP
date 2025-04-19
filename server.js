import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 3001;

// CORS Configuration
const corsOptions = {
  origin: 'https://orange-space-engine-p5vg5545x6jhr5vg-5173.app.github.dev', // Exact origin of frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true, // Optional, use if you're sending cookies or headers with auth
};

app.use(cors(corsOptions)); // Apply CORS to all routes
// app.options('*', cors(corsOptions)); // Ensure OPTIONS request for preflight is handled
app.options('*', cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint to generate MCQs
app.post('/api/generate', async (req, res) => {
  const { subject, topic } = req.body;

  const prompt = `
    Generate 3 MCQs for ${subject} on "${topic}".
    Return as JSON:
    [
      {
        "question": "...",
        "choices": ["A", "B", "C", "D"],
        "answer": "A"
      }
    ]
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;

    if (start === -1 || end === -1) {
      throw new Error('Response does not contain a valid JSON array.');
    }

    const json = JSON.parse(text.slice(start, end));
    res.json({ questions: json });
  } catch (err) {
    console.error('Error generating content:', err);
    res.status(500).json({ error: 'Gemini generation failed', details: err.message });
  }
});

app.listen(PORT, 'localhost', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
