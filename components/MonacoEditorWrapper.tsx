// components/MonacoEditorWrapper.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
}

const MonacoEditorWrapper: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);


  const handleEditorDidMount: OnMount = (editor,) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value, event) => {
    onChange(value);
  };

  const options = useMemo((): monaco.editor.IEditorOptions => ({
    quickSuggestions: { other: true, comments: true, strings: true, },
    suggest: { snippetsPreventQuickSuggestions: false, },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoSurround: 'languageDefined',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    wordWrap: 'on',
    formatOnType: true,
    formatOnPaste: true,
    autoIndent: 'full',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    cursorStyle: 'line',
    minimap: { enabled: false },
    dragAndDrop: true,
    automaticLayout: true,
    fontSize: 14,
  }), []);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <Editor
        height="50vh"
        language={language.toLowerCase()}
        value={value}
        options={options}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default MonacoEditorWrapper;