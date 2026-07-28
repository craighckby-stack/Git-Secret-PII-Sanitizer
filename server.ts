import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: High-Thinking Security Architect Analysis
  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { findings, contextCode, repoUrl } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are a Principal Security Architect and Code Evolution Lead.
Analyze these detected exposed secret/PII findings from repository/code: ${repoUrl || 'Local Code Snippet'}

Findings List:
${JSON.stringify(findings, null, 2)}

Context Code Snippet:
${contextCode || 'N/A'}

Execute deep architectural reasoning and respond with a valid JSON object matching this EXACT schema:
{
  "threatLevel": "Critical" | "High" | "Medium" | "Low",
  "summary": "High level security assessment summary",
  "blastRadius": "Detailed description of what an attacker could compromise with these exposed secrets",
  "complianceImpact": ["GDPR violation statement", "PCI-DSS compliance note"],
  "remediationSteps": ["Step 1...", "Step 2..."],
  "suggestedPatch": "// Refactored secure code snippet replacing hardcoded credentials with process.env or Secret Manager",
  "evolutionRecommendations": ["Architecture improvement 1", "CI/CD pre-commit hook setup suggestion"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const parsedData = JSON.parse(text);
      res.json(parsedData);
    } catch (err: any) {
      console.error('Gemini Analyze Error:', err);
      res.status(500).json({
        error: 'Failed to analyze code security with Gemini High Thinking',
        details: err.message,
      });
    }
  });

  // API Route: High-Thinking Architect Chat
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { question, history, findings } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are an expert Security Architect answering questions about secret mitigation, key rotation, and safe deployment.
Findings Context:
${JSON.stringify(findings || [], null, 2)}

User Question: ${question}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Gemini Chat Error:', err);
      res.status(500).json({ error: 'Chat processing failed', details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
