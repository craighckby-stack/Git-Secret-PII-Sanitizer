import React, { useMemo, useCallback } from 'react';
import CodeMirror, { Extension, EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

export interface CodeMirrorViewerProps {
  value: string;
  language?: 'javascript' | 'json' | 'text';
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onChange?: (val: string) => void;
  highlightLine?: number;
  className?: string;
  placeholder?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackValue: string;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CodeMirrorErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('CodeMirrorViewer error captured:', error, errorInfo);
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <textarea
          readOnly
          value={this.props.fallbackValue}
          className={`w-full font-mono text-sm p-4 bg-[#1e1e2e] text-slate-300 border border-slate-700/60 rounded-xl resize-none outline-none ${this.props.className ?? ''}`}
          aria-label="Fallback Code Viewer"
        />
      );
    }

    return this.props.children;
  }
}

const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: true,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  syntaxHighlighting: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: false,
  highlightActiveLine: true,
  highlightSelectionMatches: false,
} as const;

// Static extension instances cached at module scope to reduce allocation overhead
const JSON_EXTENSION: Extension = json();
const JS_TS_EXTENSION: Extension = javascript({ jsx: true, typescript: true });

const createLineHighlightExtension = (lineNumber: number): Extension => {
  return EditorView.theme({
    [`& .cm-line:nth-child(${lineNumber})`]: {
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderLeft: '2px solid #6366f1',
    },
  });
};

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = React.memo(({
  value = '',
  language = 'javascript',
  readOnly = true,
  minHeight = '200px',
  maxHeight = '500px',
  onChange,
  highlightLine,
  className = '',
  placeholder,
}) => {
  const extensions = useMemo<Extension[]>(() => {
    const extList: Extension[] = [];
    try {
      if (language === 'json') {
        extList.push(JSON_EXTENSION);
      } else if (language === 'javascript') {
        extList.push(JS_TS_EXTENSION);
      }

      if (typeof highlightLine === 'number' && highlightLine > 0) {
        extList.push(createLineHighlightExtension(highlightLine));
      }
    } catch (error) {
      console.error('CodeMirrorViewer extension configuration error:', error);
    }
    return extList;
  }, [language, highlightLine]);

  const handleChange = useCallback((val: string) => {
    if (!onChange || readOnly) {
      return;
    }
    try {
      onChange(val);
    } catch (error) {
      console.error('CodeMirrorViewer onChange execution error:', error);
    }
  }, [onChange, readOnly]);

  const ariaLabel = useMemo<string>(() => {
    const langName = language ? language.toUpperCase() : 'TEXT';
    return `${langName} Code Viewer`;
  }, [language]);

  return (
    <CodeMirrorErrorBoundary fallbackValue={value} className={className}>
      <div
        className={`rounded-xl overflow-hidden border border-slate-700/60 bg-[#1e1e2e] shadow-inner text-sm font-mono transition-colors focus-within:border-indigo-500/60 ${className}`}
        role="region"
        aria-label={ariaLabel}
      >
        <CodeMirror
          value={value}
          height="auto"
          minHeight={minHeight}
          maxHeight={maxHeight}
          theme={oneDark}
          extensions={extensions}
          readOnly={readOnly}
          editable={!readOnly}
          onChange={handleChange}
          basicSetup={BASIC_SETUP}
          placeholder={placeholder}
        />
      </div>
    </CodeMirrorErrorBoundary>
  );
});

CodeMirrorViewer.displayName = 'CodeMirrorViewer';

export default CodeMirrorViewer;