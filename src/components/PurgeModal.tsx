import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Finding } from '../types';
import { generatePurgeScript } from '../lib/purgeScript';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { ShieldAlert, Copy, Check, Download, X, AlertOctagon, Terminal } from 'lucide-react';

export interface PurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
  branch: string;
  findings: Finding[];
}

export const PurgeModal: React.FC<PurgeModalProps> = React.memo(({
  isOpen,
  onClose,
  repoUrl,
  branch,
  findings,
}) => {
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyTimeout = useCallback((): void => {
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, []);

  // Reset internal states and clean up timers when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setCopied(false);
      setCopyError(null);
      clearCopyTimeout();
    }
  }, [isOpen, clearCopyTimeout]);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      clearCopyTimeout();
    };
  }, [clearCopyTimeout]);

  // Keyboard accessibility: Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Generate purge script safely with error handling
  const { script, scriptError } = useMemo<{ script: string; scriptError: string | null }>(() => {
    try {
      const result = generatePurgeScript(repoUrl, branch, findings);
      return { script: result.script, scriptError: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error generating script';
      console.error('Error generating purge script:', err);
      return { script: '# Error generating purge script.', scriptError: errorMsg };
    }
  }, [repoUrl, branch, findings]);

  const isConfirmed = useMemo<boolean>(() => confirmInput.trim() === 'DELETE', [confirmInput]);

  const handleCopy = useCallback(async (): Promise<void> => {
    clearCopyTimeout();
    setCopyError(null);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(script);
      } else {
        // Fallback for non-secure contexts or legacy browsers
        const textArea = document.createElement('textarea');
        textArea.value = script;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error('Clipboard fallback copy command failed');
        }
      }
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err: unknown) {
      console.error('Failed to copy script text: ', err);
      setCopyError('Failed to copy');
      copyTimeoutRef.current = setTimeout(() => {
        setCopyError(null);
        copyTimeoutRef.current = null;
      }, 3000);
    }
  }, [script, clearCopyTimeout]);

  const handleDownloadScript = useCallback((): void => {
    try {
      const blob = new Blob([script], { type: 'text/x-shellscript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purge_git_history_${Date.now()}.sh`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Failed to download script:', err);
    }
  }, [script]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purge-modal-title"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="purge-modal-title" className="text-base font-bold text-slate-100">
                Full Git Commit History Purge Generator
              </h2>
              <p className="text-xs text-slate-400">
                Uses git-filter-repo --replace-text for surgical secret redaction across all commits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
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
          {scriptError && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
              <span className="font-semibold">Script Generation Error:</span> {scriptError}
            </div>
          )}

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
            <label htmlFor="purge-confirm-input" className="text-xs font-semibold text-slate-200 block">
              Type <span className="font-mono text-rose-400 font-bold">DELETE</span> to enable copy & download buttons:
            </label>
            <input
              id="purge-confirm-input"
              type="text"
              value={confirmInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              autoComplete="off"
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
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied Script!' : copyError ? copyError : 'Copy Script'}
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
});

PurgeModal.displayName = 'PurgeModal';