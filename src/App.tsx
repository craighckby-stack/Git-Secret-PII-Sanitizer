import React, { useState, useCallback, useMemo } from 'react';
import { SnippetScanner } from './components/SnippetScanner';
import { FolderScanner } from './components/FolderScanner';
import { GithubScanner } from './components/GithubScanner';
import { FindingsTable } from './components/FindingsTable';
import { AiEvolutionArchitect } from './components/AiEvolutionArchitect';
import { PurgeModal } from './components/PurgeModal';
import { Finding, ScanStats } from './types';
import { ShieldAlert, FileCode, FolderSearch, Github, Sparkles, Terminal } from 'lucide-react';

type TabType = 'snippet' | 'folder' | 'github' | 'ai';

interface NavTabConfig {
  readonly id: TabType;
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly activeClass: string;
}

const DEFAULT_REPO_URL = 'https://github.com/craighckby-stack/AI-Project-Genesis-Scaffold';
const DEFAULT_BRANCH = 'main';

const NAV_TABS: readonly NavTabConfig[] = [
  {
    id: 'github',
    label: 'GitHub Repo',
    icon: Github,
    activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
  },
  {
    id: 'snippet',
    label: 'Live Snippet',
    icon: FileCode,
    activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
  },
  {
    id: 'folder',
    label: 'Local Folder',
    icon: FolderSearch,
    activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
  },
  {
    id: 'ai',
    label: 'AI Architect',
    icon: Sparkles,
    activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20',
  },
];

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('github');
  
  // Shared state across tabs
  const [allFindings, setAllFindings] = useState<readonly Finding[]>([]);
  const [currentRepoUrl, setCurrentRepoUrl] = useState<string>(DEFAULT_REPO_URL);
  const [currentBranch, setCurrentBranch] = useState<string>(DEFAULT_BRANCH);
  const [snippetCodeContext, setSnippetCodeContext] = useState<string>('');

  // Purge script modal state
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);

  const handleScanComplete = useCallback((findings: readonly Finding[], _stats: ScanStats, repoUrl?: string, branch?: string): void => {
    setAllFindings(findings);
    if (repoUrl) setCurrentRepoUrl(repoUrl);
    if (branch) setCurrentBranch(branch);
  }, []);

  const handleOpenPurgeModal = useCallback((repoUrl: string, branch: string, findings: readonly Finding[]): void => {
    setCurrentRepoUrl(repoUrl);
    setCurrentBranch(branch);
    setAllFindings(findings);
    setIsPurgeModalOpen(true);
  }, []);

  const handleTriggerAiFromSnippet = useCallback((findings: readonly Finding[], code: string): void => {
    setAllFindings(findings);
    setSnippetCodeContext(code);
    setActiveTab('ai');
  }, []);

  const handleTriggerAiFromScan = useCallback((findings: readonly Finding[], repoUrl?: string): void => {
    setAllFindings(findings);
    if (repoUrl) setCurrentRepoUrl(repoUrl);
    setActiveTab('ai');
  }, []);

  const handleAnalyzeSingleFindingAi = useCallback((f: Finding): void => {
    setAllFindings([f]);
    setActiveTab('ai');
  }, []);

  const handleCommitFix = useCallback((path: string, pattern: string): void => {
    if (path && pattern) {
      console.info(`Commit fix registered for path: ${path}, pattern: ${pattern}`);
    }
  }, []);

  const handleClosePurgeModal = useCallback((): void => {
    setIsPurgeModalOpen(false);
  }, []);

  const handlePurgeModalRequest = useCallback((): void => {
    handleOpenPurgeModal(currentRepoUrl, currentBranch, allFindings);
  }, [handleOpenPurgeModal, currentRepoUrl, currentBranch, allFindings]);

  const hasFindings = useMemo(() => allFindings.length > 0, [allFindings.length]);

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
          <nav role="tablist" aria-label="Scanner modes" className="flex flex-wrap items-center justify-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium w-full md:w-auto">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? tab.activeClass
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.id === 'ai' && !isActive ? 'text-purple-300' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
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
            findings={[...allFindings]}
            contextCode={snippetCodeContext}
            repoUrl={currentRepoUrl}
          />
        )}

        {/* Global Filterable Findings Table (Visible whenever findings exist) */}
        {hasFindings && activeTab !== 'snippet' && (
          <div className="space-y-3 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Aggregated Security Findings & SARIF Exporter
              </h2>

              <button
                onClick={handlePurgeModalRequest}
                className="text-xs px-3 py-1.5 bg-rose-600/25 hover:bg-rose-600/35 text-rose-300 rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                Generate Git History Purge Script
              </button>
            </div>

            <FindingsTable
              findings={[...allFindings]}
              onAnalyzeFindingAi={handleAnalyzeSingleFindingAi}
              onCommitFix={handleCommitFix}
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
        onClose={handleClosePurgeModal}
        repoUrl={currentRepoUrl}
        branch={currentBranch}
        findings={[...allFindings]}
      />
    </div>
  );
}