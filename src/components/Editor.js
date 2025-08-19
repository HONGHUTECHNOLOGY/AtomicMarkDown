// 在文件顶部添加worker配置
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MonacoEditor from '@monaco-editor/react';

// 配置Monaco Environment
if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker: function (moduleId, label) {
      if (label === 'json') {
        return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url));
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url));
      }
      if (label === 'typescript' || label === 'javascript') {
        return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url));
      }
      return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
    }
  };
}

const Editor = forwardRef(({ markdown, setMarkdown, theme, settings }, ref) => {  // 添加settings参数
  const editorRef = useRef(null);
  // 根据当前主题设置编辑器主题
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
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
          base: 'vs',  // 改为亮色主题基础
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#f0f8ff',  // 亮蓝色背景
            'editor.lineHighlightBackground': '#e1f0ff',  // 行高亮背景
            'editorLineNumber.foreground': '#1e88e5',  // 行号颜色
            'editorCursor.foreground': '#1e88e5',  // 光标颜色
            'editor.foreground': '#0d47a1',  // 文字颜色
            'editor.selectionBackground': '#90caf966',  // 选择背景
            'editor.inactiveSelectionBackground': '#90caf944',  // 非活动选择背景
            'editorWidget.background': '#f5f9ff',  // 编辑器小部件背景
            'editorWidget.border': '#1e88e5',  // 编辑器小部件边框
            'list.hoverBackground': '#e3f2fd',  // 列表悬停背景
            'list.activeSelectionBackground': '#bbdefb',  // 列表活动选择背景
            'list.inactiveSelectionBackground': '#e3f2fd'  // 列表非活动选择背景
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

  // 根据设置调整编辑器选项
  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: parseInt(settings?.fontSize) || 14,  // 根据设置调整字体大小
    wordWrap: 'on',
    lineNumbers: settings?.showLineNumbers ? 'on' : 'off',  // 根据设置显示或隐藏行号
    renderWhitespace: 'selection',
    smoothScrolling: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto'
    }
  };

  return (
    <div className="editor" style={{ height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        value={markdown || ''}
        onChange={handleEditorChange}
        theme={monacoTheme}
        options={editorOptions}  // 使用动态配置的选项
        onMount={handleEditorDidMount}
      />
    </div>
  );
});

export default Editor;