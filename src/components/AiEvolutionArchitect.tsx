import React, { useState } from 'react';
import { Finding, AiAnalysisResult, ChatMessage } from '../types';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { Sparkles, ShieldAlert, Cpu, Send, Loader2, CheckCircle2, Copy, Check, FileCode2, ArrowRight } from 'lucide-react';

interface AiEvolutionArchitectProps {
  findings: Finding[];
  contextCode?: string;
  repoUrl?: string;
}

export const AiEvolutionArchitect: React.FC<AiEvolutionArchitectProps> = ({
  findings,
  contextCode,
  repoUrl,
}) => {
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);

  // Trigger high-thinking Gemini security analysis
  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings,
          contextCode: contextCode?.slice(0, 4000),
          repoUrl,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Analysis failed: ${res.statusText}`);
      }

      const data: AiAnalysisResult = await res.json();
      setAnalysis(data);

      setChatMessages([
        {
          id: 'init-msg',
          role: 'assistant',
          content: `I have completed a high-thinking architectural security assessment for your findings. Ask me any follow-up questions about key rotation, Secret Manager integration, or CI/CD security hooks!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      alert(`AI Evolution Architect Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send follow-up question to High-Thinking Architect Chat
  const handleSendChat = async () => {
    if (!inputQuestion.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: inputQuestion,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: inputQuestion,
          history: chatMessages,
          findings,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleCopyPatch = () => {
    if (analysis?.suggestedPatch) {
      navigator.clipboard.writeText(analysis.suggestedPatch);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Code Evolution Engine — Security Architect
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                  gemini-3.1-pro-preview (HIGH THINKING)
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluates blast radius, compliance risks, key rotation playbooks, and generates refactored code patches.
              </p>
            </div>
          </div>

          <button
            onClick={runDeepAnalysis}
            disabled={isAnalyzing || findings.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking & Reasoning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {analysis ? 'Re-Run Deep Reasoning' : 'Execute High-Thinking Deep Assessment'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Threat & Blast Radius Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Assessed Threat Level</span>
              <span
                className={`text-lg font-bold ${
                  analysis.threatLevel === 'Critical'
                    ? 'text-rose-400'
                    : analysis.threatLevel === 'High'
                    ? 'text-orange-400'
                    : 'text-amber-400'
                }`}
              >
                {analysis.threatLevel} Threat
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 md:col-span-2">
              <span className="text-slate-400 block font-medium">Blast Radius & Impact Analysis</span>
              <p className="text-slate-200 leading-relaxed">{analysis.blastRadius}</p>
            </div>
          </div>

          {/* Remediation Steps & Code Evolution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step-by-Step Remediation */}
            <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Step-by-Step Remediation Plan
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.remediationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Architecture Evolution Recommendations */}
            <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Code Evolution & Hardening Recommendations
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.evolutionRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Refactored Code Patch */}
          {analysis.suggestedPatch && (
            <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  Suggested Safe Code Patch
                </h3>
                <button
                  onClick={handleCopyPatch}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedPatch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPatch ? 'Copied Patch!' : 'Copy Code Patch'}
                </button>
              </div>

              <CodeMirrorViewer
                value={analysis.suggestedPatch}
                language="javascript"
                minHeight="200px"
              />
            </div>
          )}

          {/* Interactive Architect Chat */}
          <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Interactive Security Architect Q&A
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 ml-auto'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className="font-bold text-[10px] text-slate-400 block mb-1">
                    {msg.role === 'user' ? 'You' : 'High-Thinking Architect'}
                  </span>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask follow-up questions e.g. How do I configure AWS Secrets Manager?"
                className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendChat}
                disabled={isSendingChat || !inputQuestion.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
