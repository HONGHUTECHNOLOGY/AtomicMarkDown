// 在文件顶部添加worker配置
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { isScrollProcessing, setScrollProcessing, safeScrollSync } from '../utils/scrollSync';

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

const Editor = forwardRef(({ markdown, setMarkdown, theme, settings, onScroll }, ref) => {  // 添加onScroll参数
  const editorRef = useRef(null);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true); // 添加同步状态控制
  const scrollListenerRef = useRef(null); // 保存滚动监听器的引用
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
    },
    // 添加获取滚动位置的方法
    getScrollTop: () => {
      if (editorRef.current) {
        return editorRef.current.getScrollTop();
      }
      return 0;
    },
    // 添加设置滚动位置的方法
    setScrollTop: (scrollTop) => {
      if (editorRef.current) {
        // 使用新的滚动同步机制
        safeScrollSync(() => {
          editorRef.current.setScrollTop(scrollTop);
        });
      }
    },
    // 添加获取滚动高度的方法
    getScrollHeight: () => {
      if (editorRef.current) {
        // 使用getScrollHeight获取编辑器滚动高度
        return editorRef.current.getScrollHeight();
      }
      return 0;
    },
    // 修改获取内容高度的方法
    getContentHeight: () => {
      if (editorRef.current) {
        try {
          // 使用Monaco Editor的正确API获取内容高度
          const model = editorRef.current.getModel();
          if (model) {
            const lineCount = model.getLineCount();
            // 正确获取行高选项
            const lineHeight = editorRef.current.getOption(60); // 60是lineHeight的选项ID
            // 返回行数*行高，确保能正确反映内容高度
            return Math.max(lineCount * lineHeight, 1);
          }
          // 如果无法获取model，使用scrollHeight作为备选
          return Math.max(editorRef.current.getScrollHeight(), 1);
        } catch (error) {
          console.error('获取内容高度错误:', error);
          // 出错时返回一个默认的有效值
          return Math.max(editorRef.current?.getScrollHeight() || 1, 1);
        }
      }
      return 1;
    },
    // 添加获取实际可视高度的方法
    getClientHeight: () => {
      if (editorRef.current) {
        try {
          // 使用与handleEditorDidMount中相同的逻辑获取实际可视高度
          const editorHeight = editorRef.current.getLayoutInfo()?.height || 
                              editorRef.current.getDomNode()?.clientHeight || 300;
          return Math.max(1, editorHeight);
        } catch (error) {
          console.error('获取可视高度错误:', error);
          return 300; // 默认高度
        }
      }
      return 300;
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

  // 添加useEffect来响应settings变化
  useEffect(() => {
    // 根据settings.syncScroll更新同步状态
    const shouldSync = settings && typeof settings === 'object' 
      ? (settings.syncScroll !== false)
      : true;
    setIsSyncEnabled(shouldSync);
  }, [settings]);

  // 修改handleEditorDidMount中的滚动事件处理
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();
    
    // 定义滚动事件处理函数
    const handleScrollChange = (e) => {
      // 使用新的滚动同步机制
      safeScrollSync(() => {
        // 检查同步是否启用 - 直接检查settings的当前值
        // 修复：只有当settings.syncScroll明确为true时才启用同步滚动
        const shouldSync = settings && typeof settings === 'object' 
          ? (settings.syncScroll === true)
          : false; // 默认关闭同步滚动
        if (!shouldSync || !onScroll) {
          return;
        }
        
        const scrollTop = editor.getScrollTop();
        const scrollHeight = editor.getScrollHeight();
        const editorHeight = editor.getLayoutInfo()?.height || editor.getDomNode()?.clientHeight || 300;
        
        onScroll({
          scrollTop: Math.max(0, scrollTop || 0),
          scrollHeight: Math.max(1, scrollHeight || 1),
          height: Math.max(1, editorHeight || 1),
          source: 'editor'
        });
      });
    };
    
    // 只有在同步滚动启用时才添加滚动监听器
    // 修复：只有当settings.syncScroll明确为true时才启用同步滚动
    const shouldSync = settings && typeof settings === 'object' 
      ? (settings.syncScroll === true)
      : false; // 默认关闭同步滚动
    
    if (shouldSync) {
      // 保存滚动监听器引用
      scrollListenerRef.current = editor.onDidScrollChange(handleScrollChange);
    }
    
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

  // 添加useEffect来动态管理滚动监听器
  useEffect(() => {
    // 检查同步是否启用
    // 修复：只有当settings.syncScroll明确为true时才启用同步滚动
    const shouldSync = settings && typeof settings === 'object' 
      ? (settings.syncScroll === true)
      : false; // 默认关闭同步滚动
    
    // 如果编辑器已挂载
    if (editorRef.current) {
      // 如果应该同步但监听器不存在，则添加监听器
      if (shouldSync && !scrollListenerRef.current) {
        const handleScrollChange = (e) => {
          safeScrollSync(() => {
            const shouldSync = settings && typeof settings === 'object' 
              ? (settings.syncScroll === true)
              : false; // 默认关闭同步滚动
            if (!shouldSync || !onScroll) {
              return;
            }
            
            const editor = editorRef.current;
            const scrollTop = editor.getScrollTop();
            const scrollHeight = editor.getScrollHeight();
            const editorHeight = editor.getLayoutInfo()?.height || editor.getDomNode()?.clientHeight || 300;
            
            onScroll({
              scrollTop: Math.max(0, scrollTop || 0),
              scrollHeight: Math.max(1, scrollHeight || 1),
              height: Math.max(1, editorHeight || 1),
              source: 'editor'
            });
          });
        };
        
        scrollListenerRef.current = editorRef.current.onDidScrollChange(handleScrollChange);
      }
      // 如果不应该同步但监听器存在，则移除监听器
      else if (!shouldSync && scrollListenerRef.current) {
        scrollListenerRef.current.dispose();
        scrollListenerRef.current = null;
      }
    }
    
    // 清理函数
    return () => {
      if (scrollListenerRef.current) {
        scrollListenerRef.current.dispose();
        scrollListenerRef.current = null;
      }
    };
  }, [settings, onScroll]); // 依赖settings和onScroll

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