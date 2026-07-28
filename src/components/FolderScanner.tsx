import React, { useState, useRef } from 'react';
import { sanitizeContent, isIgnoredPath, isBinaryContent, calculateScanStats } from '../lib/scanner';
import { Finding, ScanStats, SkipBreakdown } from '../types';
import { FolderSearch, FolderUp, FileText, ShieldAlert, CheckCircle2, AlertOctagon, FileCheck2, Loader2, Sparkles } from 'lucide-react';

interface FolderScannerProps {
  onScanComplete: (findings: Finding[], stats: ScanStats) => void;
  onAnalyzeAi?: (findings: Finding[]) => void;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export const FolderScanner: React.FC<FolderScannerProps> = ({ onScanComplete, onAnalyzeAi }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setFindings([]);
    setStats(null);

    const fileList = Array.from(files);
    const total = fileList.length;
    const startTime = performance.now();

    const localFindings: Finding[] = [];
    let scannedCount = 0;
    const skipBreakdown: SkipBreakdown = { binary: 0, tooLarge: 0, ignored: 0 };

    for (let i = 0; i < total; i++) {
      const file = fileList[i];
      const relativePath = file.webkitRelativePath || file.name;

      setProgress({
        current: i + 1,
        total,
        currentFile: relativePath,
      });

      // 1. Check if path is ignored (node_modules, .git, build, lock files)
      if (isIgnoredPath(relativePath)) {
        skipBreakdown.ignored++;
        continue;
      }

      // 2. Size limit check
      if (file.size > MAX_FILE_SIZE) {
        skipBreakdown.tooLarge++;
        continue;
      }

      try {
        const text = await file.text();

        // 3. Binary file check
        if (isBinaryContent(text)) {
          skipBreakdown.binary++;
          continue;
        }

        // 4. Scan file content
        const { findings: fileFindings } = sanitizeContent(text, relativePath);
        if (fileFindings.length > 0) {
          localFindings.push(...fileFindings);
        }
        scannedCount++;
      } catch (err) {
        skipBreakdown.binary++;
      }
    }

    const durationSeconds = (performance.now() - startTime) / 1000;
    const computedStats = calculateScanStats(scannedCount, skipBreakdown, localFindings, durationSeconds);

    setFindings(localFindings);
    setStats(computedStats);
    setIsScanning(false);

    onScanComplete(localFindings, computedStats);
  };

  return (
    <div className="space-y-6">
      {/* Directory Upload Card */}
      <div className="p-8 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <FolderSearch className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-100">Local Folder Security Scan</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Select a project folder from your disk. All files are scanned locally in memory with maximum 8MB file bounds and automatic binary/node_modules filtering.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory non-standard attribute
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning Directory...
            </>
          ) : (
            <>
              <FolderUp className="w-4 h-4" />
              Select Local Folder to Scan
            </>
          )}
        </button>
      </div>

      {/* Scanning Progress Banner */}
      {isScanning && (
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              Scanning: {progress.currentFile}
            </span>
            <span>
              {progress.current} / {progress.total} files ({Math.round((progress.current / progress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-150"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Summary Dashboard */}
      {stats && !isScanning && (
        <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Folder Scan Completed in {stats.durationSeconds}s
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Processed {stats.filesScanned} readable code files. Skipped {stats.filesSkipped} unreadable/large files.
              </p>
            </div>

            {findings.length > 0 && onAnalyzeAi && (
              <button
                onClick={() => onAnalyzeAi(findings)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Folder Findings with AI
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Files Scanned</span>
              <span className="text-lg font-bold text-slate-100">{stats.filesScanned}</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Total Findings</span>
              <span className={`text-lg font-bold ${findings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.totalFindings}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Skipped (Binary / Large)</span>
              <span className="text-lg font-bold text-slate-300">
                {stats.skipReasons.binary + stats.skipReasons.tooLarge}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Skipped (Ignored Paths)</span>
              <span className="text-lg font-bold text-slate-300">{stats.skipReasons.ignored}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
