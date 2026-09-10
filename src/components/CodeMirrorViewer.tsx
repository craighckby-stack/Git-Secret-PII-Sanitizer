import React, { useMemo, useCallback } from 'react';
import CodeMirror, { Extension } from '@uiw/react-codemirror';
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

// Cache default parser extensions to minimize memory allocation and re-parsing overhead
const JSON_EXTENSION: Extension = json();
const JS_TS_EXTENSION: Extension = javascript({ jsx: true, typescript: true });

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = React.memo(({
  value = '',
  language = 'javascript',
  readOnly = true,
  minHeight = '200px',
  maxHeight = '500px',
  onChange,
  className = '',
  placeholder,
}) => {
  const extensions = useMemo<Extension[]>(() => {
    try {
      if (language === 'json') {
        return [JSON_EXTENSION];
      }
      if (language === 'text') {
        return [];
      }
      return [JS_TS_EXTENSION];
    } catch (error) {
      console.error('CodeMirrorViewer extension initialization error:', error);
      return [];
    }
  }, [language]);

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

  return (
    <div
      className={`rounded-xl overflow-hidden border border-slate-700/60 bg-[#1e1e2e] shadow-inner text-sm font-mono transition-colors focus-within:border-indigo-500/60 ${className}`}
      role="region"
      aria-label={`${language.toUpperCase()} Code Viewer`}
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
  );
});

CodeMirrorViewer.displayName = 'CodeMirrorViewer';
export default CodeMirrorViewer;