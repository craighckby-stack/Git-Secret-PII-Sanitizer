import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AnalyzeRequestBody {
  findings?: unknown;
  contextCode?: string;
  repoUrl?: string;
}

export interface ChatRequestBody {
  question?: string;
  history?: unknown[];
  findings?: unknown;
}

export interface AnalysisResponse {
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  summary: string;
  blastRadius: string;
  complianceImpact: string[];
  remediationSteps: string[];
  suggestedPatch: string;
  evolutionRecommendations: string[];
}

export interface ChatResponse {
  reply: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

let geminiClientInstance: GoogleGenAI | null = null;

/**
 * Returns a cached singleton instance of the GoogleGenAI client.
 */
const getGeminiClient = (): GoogleGenAI => {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientInstance;
};

/**
 * Safely stringifies unknown data payloads with fallback error handling.
 */
const safeJsonStringify = (data: unknown, indent = 2): string => {
  if (data === undefined || data === null) {
    return '[]';
  }
  try {
    return JSON.stringify(data, null, indent);
  } catch {
    return String(data);
  }
};

/**
 * Initializes and starts the Express server with Vite middleware integration and Gemini endpoints.
 */
async function startServer(): Promise<void> {
  const app = express();
  const PORT: number = Number(process.env.PORT) || 3000;
  let viteDevServer: ViteDevServer | undefined;

  app.use(express.json({ limit: '10mb' }));

  // API Route: High-Thinking Security Architect Analysis
  app.post(
    '/api/gemini/analyze',
    async (
      req: Request<Record<string, unknown>, AnalysisResponse | ErrorResponse, AnalyzeRequestBody>,
      res: Response<AnalysisResponse | ErrorResponse>
    ): Promise<void> => {
      try {
        const { findings, contextCode, repoUrl } = req.body || {};
        const ai = getGeminiClient();

        const prompt = `You are a Principal Security Architect and Code Evolution Lead.
Analyze these detected exposed secret/PII findings from repository/code: ${repoUrl || 'Local Code Snippet'}

Findings List:
${safeJsonStringify(findings)}

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
        let parsedData: Partial<AnalysisResponse>;
        try {
          parsedData = JSON.parse(text) as Partial<AnalysisResponse>;
        } catch (parseErr) {
          throw new Error(
            `Failed to parse AI structured response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
          );
        }

        const validatedResponse: AnalysisResponse = {
          threatLevel: parsedData.threatLevel || 'Medium',
          summary: parsedData.summary || 'Analysis complete.',
          blastRadius: parsedData.blastRadius || 'N/A',
          complianceImpact: Array.isArray(parsedData.complianceImpact) ? parsedData.complianceImpact : [],
          remediationSteps: Array.isArray(parsedData.remediationSteps) ? parsedData.remediationSteps : [],
          suggestedPatch: parsedData.suggestedPatch || '',
          evolutionRecommendations: Array.isArray(parsedData.evolutionRecommendations) ? parsedData.evolutionRecommendations : [],
        };

        res.json(validatedResponse);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Gemini Analyze Error:', err);
        res.status(500).json({
          error: 'Failed to analyze code security with Gemini High Thinking',
          details: errorMessage,
        });
      }
    }
  );

  // API Route: High-Thinking Architect Chat
  app.post(
    '/api/gemini/chat',
    async (
      req: Request<Record<string, unknown>, ChatResponse | ErrorResponse, ChatRequestBody>,
      res: Response<ChatResponse | ErrorResponse>
    ): Promise<void> => {
      try {
        const { question, findings } = req.body || {};
        const ai = getGeminiClient();

        const prompt = `You are an expert Security Architect answering questions about secret mitigation, key rotation, and safe deployment.
Findings Context:
${safeJsonStringify(findings)}

User Question: ${question || ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });

        res.json({ reply: response.text ?? '' });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Gemini Chat Error:', err);
        res.status(500).json({ error: 'Chat processing failed', details: errorMessage });
      }
    }
  );

  // Vite middleware for development vs static build serving for production
  if (process.env.NODE_ENV !== 'production') {
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteDevServer.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '1d', etag: true }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Express Error Handler
  app.use((err: Error, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (viteDevServer) {
      await viteDevServer.close();
    }
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
}

startServer().catch((err: unknown) => {
  console.error('Critical server startup failure:', err);
  process.exit(1);
});