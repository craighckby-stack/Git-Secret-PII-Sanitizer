import React, { useState } from 'react';
import { SnippetScanner } from './components/SnippetScanner';
import { FolderScanner } from './components/FolderScanner';
import { GithubScanner } from './components/GithubScanner';
import { FindingsTable } from './components/FindingsTable';
import { AiEvolutionArchitect } from './components/AiEvolutionArchitect';
import { PurgeModal } from './components/PurgeModal';
import { Finding, ScanStats } from './types';
import { ShieldAlert, FileCode, FolderSearch, Github, Sparkles, Terminal, ShieldCheck, Layers, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'snippet' | 'folder' | 'github' | 'ai'>('github');
  
  // Shared state across tabs
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [currentRepoUrl, setCurrentRepoUrl] = useState<string>('https://github.com/craighckby-stack/AI-Project-Genesis-Scaffold');
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [snippetCodeContext, setSnippetCodeContext] = useState<string>('');

  // Purge script modal state
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);

  const handleScanComplete = (findings: Finding[], stats: ScanStats, repoUrl?: string, branch?: string) => {
    setAllFindings(findings);
    if (repoUrl) setCurrentRepoUrl(repoUrl);
    if (branch) setCurrentBranch(branch);
  };

  const handleOpenPurgeModal = (repoUrl: string, branch: string, findings: Finding[]) => {
    setCurrentRepoUrl(repoUrl);
    setCurrentBranch(branch);
    setAllFindings(findings);
    setIsPurgeModalOpen(true);
  };

  const handleTriggerAiFromSnippet = (findings: Finding[], code: string) => {
    setAllFindings(findings);
    setSnippetCodeContext(code);
    setActiveTab('ai');
  };

  const handleTriggerAiFromScan = (findings: Finding[], repoUrl?: string) => {
    setAllFindings(findings);
    if (repoUrl) setCurrentRepoUrl(repoUrl);
    setActiveTab('ai');
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-16 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-start">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/30 text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate">Git Secret & PII Sanitizer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700 shrink-0">
                  v2.5 Pro
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Code Evolution Engine & History Purge Architect</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center justify-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium w-full md:w-auto">
            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              GitHub Repo
            </button>

            <button
              onClick={() => setActiveTab('snippet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'snippet'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Live Snippet
            </button>

            <button
              onClick={() => setActiveTab('folder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'folder'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderSearch className="w-3.5 h-3.5" />
              Local Folder
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              AI Architect
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {activeTab === 'github' && (
          <GithubScanner
            onScanComplete={handleScanComplete}
            onOpenPurgeModal={handleOpenPurgeModal}
            onAnalyzeAi={handleTriggerAiFromScan}
          />
        )}

        {activeTab === 'snippet' && (
          <SnippetScanner onAnalyzeAi={handleTriggerAiFromSnippet} />
        )}

        {activeTab === 'folder' && (
          <FolderScanner
            onScanComplete={handleScanComplete}
            onAnalyzeAi={handleTriggerAiFromScan}
          />
        )}

        {activeTab === 'ai' && (
          <AiEvolutionArchitect
            findings={allFindings}
            contextCode={snippetCodeContext}
            repoUrl={currentRepoUrl}
          />
        )}

        {/* Global Filterable Findings Table (Visible whenever findings exist) */}
        {allFindings.length > 0 && activeTab !== 'snippet' && (
          <div className="space-y-3 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Aggregated Security Findings & SARIF Exporter
              </h2>

              <button
                onClick={() => handleOpenPurgeModal(currentRepoUrl, currentBranch, allFindings)}
                className="text-xs px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                Generate Git History Purge Script
              </button>
            </div>

            <FindingsTable
              findings={allFindings}
              onAnalyzeFindingAi={(f) => {
                setAllFindings([f]);
                setActiveTab('ai');
              }}
              onCommitFix={(path, pattern) => {
                alert(`Conventional commit fix registered for ${path} (${pattern})`);
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Git Secret & PII Sanitizer - Code Evolution Engine (Non-Commercial Use Only)</span>
          <span className="font-mono text-[11px] text-slate-600">
            Powered by Google Gemini 3.1 Pro (High Thinking) | copyright craighckby-stack 2026
          </span>
        </div>
      </footer>

      {/* Git History Purge Script Modal */}
      <PurgeModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        repoUrl={currentRepoUrl}
        branch={currentBranch}
        findings={allFindings}
      />
    </div>
  );
}
