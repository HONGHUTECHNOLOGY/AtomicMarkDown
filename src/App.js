import React, { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
import './App.css';

function App() {
  // 扩展主题选项
  const [theme, setTheme] = useState('light');
  const [markdown, setMarkdown] = useState('');
  const editorRef = useRef(null);

  // 可用主题列表
  const availableThemes = [
    { id: 'light', name: '经典白' },
    { id: 'dark', name: '深邃黑' },
    { id: 'blue', name: '科技蓝' },
    { id: 'green', name: '清新绿' },
    { id: 'purple', name: '优雅紫' }
  ];

  // 初始化时从localStorage加载
  useEffect(() => {
    const savedMarkdown = localStorage.getItem('markdown');
    const savedTheme = localStorage.getItem('theme');
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    }
    if (savedTheme && availableThemes.find(t => t.id === savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // 自动保存到localStorage - 优化版本
  useEffect(() => {
    const saveToLocalStorage = () => {
      localStorage.setItem('markdown', markdown);
    };

    // 使用防抖避免频繁保存
    const timeoutId = setTimeout(saveToLocalStorage, 2000);

    // 清理函数会在下次markdown变化时执行
    return () => clearTimeout(timeoutId);
  }, [markdown]);

  // 切换主题
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  return (
    <div className={`app ${theme}`}>
      <header className="header">
        <h1>原子Markdown编辑器</h1>
        <div className="theme-selector">
          {availableThemes.map(t => (
            <button 
              key={t.id}
              className={`theme-btn ${theme === t.id ? 'active' : ''}`}
              onClick={() => toggleTheme(t.id)}
              title={t.name}
            >
              {t.id === 'light' && '☀️'}
              {t.id === 'dark' && '🌙'}
              {t.id === 'blue' && '🔵'}
              {t.id === 'green' && '🟢'}
              {t.id === 'purple' && '🟣'}
            </button>
          ))}
        </div>
      </header>
      <Toolbar editorRef={editorRef} />
      <div className="editor-container">
        <Editor 
          ref={editorRef}
          markdown={markdown} 
          setMarkdown={setMarkdown} 
          theme={theme} 
        />
        <Preview markdown={markdown} theme={theme} />
      </div>
    </div>
  );
}

export default App;