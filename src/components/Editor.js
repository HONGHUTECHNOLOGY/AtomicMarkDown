import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MonacoEditor from '@monaco-editor/react';

const Editor = forwardRef(({ markdown, setMarkdown, theme }, ref) => {
  const editorRef = useRef(null);
  // 根据当前主题设置编辑器主题
  const monacoTheme = theme === 'dark' || theme === 'blue' ? 'vs-dark' : 'vs';
  const skipNextUpdate = useRef(false);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        const selection = editor.getSelection();
        const id = { major: 1, minor: 1 };
        const op = {
          identifier: id,
          range: selection,
          text: text,
          forceMoveMarkers: true
        };
        editor.executeEdits("toolbar-insert", [op]);
        editor.focus();
      }
    }
  }));

  const handleEditorChange = (value) => {
    // 确保值不为undefined时才更新
    if (value !== undefined && value !== null) {
      // 标记跳过下一次状态同步检查
      skipNextUpdate.current = true;
      setMarkdown(value);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();
    
    // 为不同主题定义自定义颜色
    if (monaco) {
      // 绿色主题
      if (theme === 'green') {
        monaco.editor.defineTheme('green-theme', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#f8fff8f2',
            'editor.lineHighlightBackground': '#e6ffe6',
            'editorLineNumber.foreground': '#2e7d32',
            'editorCursor.foreground': '#2e7d32',
            'editor.foreground': '#2e7d32'
          }
        });
        monaco.editor.setTheme('green-theme');
      }
      // 蓝色主题
      else if (theme === 'blue') {
        monaco.editor.defineTheme('blue-theme', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#1e3a5f',
            'editor.lineHighlightBackground': '#2a4a6e',
            'editorLineNumber.foreground': '#a0cfff',
            'editorCursor.foreground': '#a0cfff',
            'editor.foreground': '#e0f0ff'
          }
        });
        monaco.editor.setTheme('blue-theme');
      }
      // 紫色主题
      else if (theme === 'purple') {
        monaco.editor.defineTheme('purple-theme', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#fcf5ff',
            'editor.lineHighlightBackground': '#f3e5f5',
            'editorLineNumber.foreground': '#9c27b0',
            'editorCursor.foreground': '#9c27b0',
            'editor.foreground': '#6a1b9a'
          }
        });
        monaco.editor.setTheme('purple-theme');
      }
    }
  };

  // 优化编辑器值与状态同步
  useEffect(() => {
    // 如果刚更新了状态，则跳过同步检查
    if (skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }
    
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      // 只有当值确实不同时才更新
      if (currentValue !== markdown) {
        editorRef.current.setValue(markdown || '');
      }
    }
  }, [markdown]);

  return (
    <div className="editor" style={{ height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        value={markdown || ''}
        onChange={handleEditorChange}
        theme={monacoTheme}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
          }
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
});

export default Editor;