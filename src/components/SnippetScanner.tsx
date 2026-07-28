import React, { useState, useMemo } from 'react';
import { sanitizeContent } from '../lib/scanner';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { ShieldAlert, ShieldCheck, Copy, Check, Sparkles, AlertTriangle, FileCode } from 'lucide-react';
import { Finding } from '../types';

interface SnippetScannerProps {
  onAnalyzeAi?: (findings: Finding[], snippetContent: string) => void;
}

const SAMPLE_SNIPPETS = [
  {
    name: 'OpenAI + Database Env Sample',
    code: `// Express Configuration
const express = require('express');
const app = express();

const OPENAI_API_KEY = "sk-proj-abc1239876543210987654321000111222333";
const MONGO_URI = "mongodb+srv://admin:P@ssw0rd2026!@cluster0.mongodb.net/prod";
const STRIPE_SECRET = "sk_live_51M0abcdef1234567890123456789";

app.listen(3000, () => {
  console.log("Server listening on 3000");
});`,
  },
  {
    name: 'AWS & PII Credential Block',
    code: `aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Customer Support Log
User email: sarah.connor@cyberdyne.org
User phone: +1 (555) 234-5678
Refund Card: 4532 0150 9872 1120`,
  },
];

export const SnippetScanner: React.FC<SnippetScannerProps> = ({ onAnalyzeAi }) => {
  const [inputCode, setInputCode] = useState<string>(SAMPLE_SNIPPETS[0].code);
  const [copied, setCopied] = useState<boolean>(false);

  const { sanitizedContent, findings } = useMemo(() => {
    return sanitizeContent(inputCode, 'snippet.js');
  }, [inputCode]);

  const handleCopySanitized = () => {
    navigator.clipboard.writeText(sanitizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            Live Code & Snippet Sanitizer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Paste raw code or environment files to instantly detect and redact exposed secrets and PII in real-time.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Load sample:</span>
          {SAMPLE_SNIPPETS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setInputCode(sample.code)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Sanitized Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
              Raw Code Input
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {inputCode.length} chars | {inputCode.split('\n').length} lines
            </span>
          </div>
          <CodeMirrorViewer
            value={inputCode}
            readOnly={false}
            onChange={(val) => setInputCode(val)}
            minHeight="340px"
          />
        </div>

        {/* Right: Sanitized Output View */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Surgically Redacted Output
            </label>
            <button
              onClick={handleCopySanitized}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 rounded-lg border border-emerald-500/30 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Redacted Code'}
            </button>
          </div>
          <CodeMirrorViewer
            value={sanitizedContent}
            readOnly={true}
            minHeight="340px"
          />
        </div>
      </div>

      {/* Realtime Findings Summary Bar */}
      <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {findings.length > 0 ? (
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                {findings.length > 0
                  ? `Detected ${findings.length} Sensitive Key / PII Exposure${findings.length > 1 ? 's' : ''}`
                  : 'Clean — No Exposed Secrets or PII Detected'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {findings.length > 0
                  ? 'All matched secret values have been replaced with type-specific placeholders in the redacted output.'
                  : 'Snippet is safe to commit or share.'}
              </p>
            </div>
          </div>

          {findings.length > 0 && onAnalyzeAi && (
            <button
              onClick={() => onAnalyzeAi(findings, inputCode)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              AI Architect Deep Reasoning
            </button>
          )}
        </div>

        {/* Live Findings Grid */}
        {findings.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-slate-800">
            {findings.map((f, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                      f.severity === 'Critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : f.severity === 'High'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : f.severity === 'Medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {f.severity}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">{f.patternName}</span>
                    <span className="text-slate-500 ml-2 font-mono">Line {f.lineNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono bg-slate-900/60 px-2 py-1 rounded text-[11px] truncate max-w-xs">
                    {f.contextSnippet}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                    Confidence: {f.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
