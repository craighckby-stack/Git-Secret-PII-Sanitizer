import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeMirrorViewerProps {
  value: string;
  language?: 'javascript' | 'json' | 'text';
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onChange?: (val: string) => void;
  highlightLine?: number;
}

export const CodeMirrorViewer: React.FC<CodeMirrorViewerProps> = ({
  value,
  language = 'javascript',
  readOnly = true,
  minHeight = '200px',
  maxHeight = '500px',
  onChange,
}) => {
  const extensions = [];
  if (language === 'javascript' || language === 'text') {
    extensions.push(javascript({ jsx: true, typescript: true }));
  } else if (language === 'json') {
    extensions.push(json());
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-[#1e1e2e] shadow-inner text-sm font-mono">
      <CodeMirror
        value={value}
        height="auto"
        minHeight={minHeight}
        maxHeight={maxHeight}
        theme={oneDark}
        extensions={extensions}
        readOnly={readOnly}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
        }}
      />
    </div>
  );
};
