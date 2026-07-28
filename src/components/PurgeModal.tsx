import React, { useState, useMemo } from 'react';
import { Finding } from '../types';
import { generatePurgeScript } from '../lib/purgeScript';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { ShieldAlert, Copy, Check, Download, X, AlertOctagon, Terminal } from 'lucide-react';

interface PurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
  branch: string;
  findings: Finding[];
}

export const PurgeModal: React.FC<PurgeModalProps> = ({
  isOpen,
  onClose,
  repoUrl,
  branch,
  findings,
}) => {
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const { script, replacementsContent } = useMemo(() => {
    return generatePurgeScript(repoUrl, branch, findings);
  }, [repoUrl, branch, findings]);

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purge_git_history_${Date.now()}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Full Git Commit History Purge Generator</h2>
              <p className="text-xs text-slate-400">Uses git-filter-repo --replace-text for surgical secret redaction across all commits</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-200 mb-0.5">CRITICAL WARNING: REWRITING COMMIT HISTORY</span>
            Executing this script runs <code className="bg-rose-950/60 px-1 py-0.5 rounded font-mono">git filter-repo --replace-text</code> against a mirror clone. It surgically overwrites secret strings across all past commits, tags, and branches. Force-pushing this rewritten tree requires all team members to re-clone the repository fresh.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Generated Shell Script
            </label>
            <CodeMirrorViewer
              value={script}
              language="javascript"
              minHeight="220px"
              maxHeight="280px"
            />
          </div>

          {/* Safety Confirm Input */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-200 block">
              Type <span className="font-mono text-rose-400 font-bold">DELETE</span> to enable copy & download buttons:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!isConfirmed}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Script!' : 'Copy Script'}
            </button>

            <button
              onClick={handleDownloadScript}
              disabled={!isConfirmed}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Download .sh Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
