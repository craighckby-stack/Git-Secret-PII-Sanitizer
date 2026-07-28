import React, { useState, useMemo } from 'react';
import { Finding, Severity } from '../types';
import { exportToJson, exportToCsv, exportToSarif } from '../lib/scanner';
import { CodeMirrorViewer } from './CodeMirrorViewer';
import { Filter, Download, Search, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Copy, Check, GitCommit } from 'lucide-react';

interface FindingsTableProps {
  findings: Finding[];
  onAnalyzeFindingAi?: (finding: Finding) => void;
  onCommitFix?: (filePath: string, patternName: string) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  onAnalyzeFindingAi,
  onCommitFix,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    findings.forEach(f => set.add(f.category));
    return Array.from(set);
  }, [findings]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPath = f.filePath.toLowerCase().includes(q);
        const matchesName = f.patternName.toLowerCase().includes(q);
        const matchesContext = f.contextSnippet.toLowerCase().includes(q);
        if (!matchesPath && !matchesName && !matchesContext) return false;
      }
      return true;
    });
  }, [findings, severityFilter, categoryFilter, searchQuery]);

  // Handle Export Downloads
  const handleDownload = (type: 'json' | 'csv' | 'sarif') => {
    let content = '';
    let filename = `security_findings_${Date.now()}`;
    let mime = 'text/plain';

    if (type === 'json') {
      content = exportToJson(filteredFindings);
      filename += '.json';
      mime = 'application/json';
    } else if (type === 'csv') {
      content = exportToCsv(filteredFindings);
      filename += '.csv';
      mime = 'text/csv';
    } else if (type === 'sarif') {
      content = exportToSarif(filteredFindings);
      filename += '.sarif';
      mime = 'application/json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRedacted = (finding: Finding) => {
    navigator.clipboard.writeText(finding.redactedText);
    setCopiedId(finding.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Export Controls Bar */}
      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search & Filter Inputs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file path or pattern..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[160px]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
          <span className="text-[11px] text-slate-400 font-medium">Export Findings:</span>
          <button
            onClick={() => handleDownload('json')}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" /> JSON
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={() => handleDownload('sarif')}
            className="px-2.5 py-1 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" /> SARIF v2.1
          </button>
        </div>
      </div>

      {/* Findings Count Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-400">
          Showing {filteredFindings.length} of {findings.length} total findings
        </span>
      </div>

      {/* Findings List */}
      <div className="space-y-2">
        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
            No findings match your selected filter options.
          </div>
        ) : (
          filteredFindings.map((f) => {
            const isExpanded = expandedId === f.id;
            return (
              <div
                key={f.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    {/* Severity Badge */}
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] shrink-0 ${
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

                    {/* Confidence Badge */}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-semibold border border-slate-700 shrink-0">
                      Conf: {f.confidence}
                    </span>

                    {/* Pattern & Path Info */}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-200 block truncate">{f.patternName}</span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        {f.filePath}:{f.lineNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 truncate max-w-[180px] sm:max-w-xs block">
                      {f.contextSnippet}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Expanded Inspection & Action Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Exposed Text vs Redacted Preview */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-rose-400 block">Exposed Secret Value:</span>
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 font-mono text-xs break-all">
                          {f.matchedText}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-emerald-400 block">Surgically Redacted Replacement:</span>
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 font-mono text-xs break-all">
                          {f.redactedText}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCopyRedacted(f)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedId === f.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === f.id ? 'Copied Placeholder' : 'Copy Placeholder'}
                      </button>

                      {onCommitFix && (
                        <button
                          onClick={() => onCommitFix(f.filePath, f.patternName)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <GitCommit className="w-3.5 h-3.5" />
                          Commit HEAD Fix
                        </button>
                      )}

                      {onAnalyzeFindingAi && (
                        <button
                          onClick={() => onAnalyzeFindingAi(f)}
                          className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Analyze with AI Architect
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
