import React, { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
import Settings from './components/Settings';
import './styles/App-base.css';
import './styles/theme-light.css';
import './styles/theme-dark.css';
import './styles/theme-blue.css';
import './styles/theme-green.css';
import './styles/theme-purple.css';
import './styles/export-styles.css';
import './styles/chart-styles.css';

function App() {
  // 扩展主题选项
  const [theme, setTheme] = useState('light');
  const [markdown, setMarkdown] = useState('');
  const [settings, setSettings] = useState({
    autoSave: true,
    showLineNumbers: false,
    fontSize: '14',
    enableMermaid: true,
    enableCodeHighlight: true,
    mathRenderer: 'none',
    pngQuality: '2',
    includeBackground: true,
    pdfPageSize: 'a4'
  });
  const [showSettings, setShowSettings] = useState(false);
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
    const savedSettings = localStorage.getItem('settings');
    
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    }
    if (savedTheme && availableThemes.find(t => t.id === savedTheme)) {
      setTheme(savedTheme);
    }
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('加载设置失败:', e);
      }
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

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // 切换主题
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  // 更新设置
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className={`app ${theme}`}>
      <header className="header">
        <h1>原子Markdown编辑器</h1>
        <div className="header-controls">
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
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </header>
      <Toolbar editorRef={editorRef} settings={settings} />
      <div className="editor-container">
        <Editor 
          ref={editorRef}
          markdown={markdown} 
          setMarkdown={setMarkdown} 
          theme={theme} 
          settings={settings}
        />
        <Preview markdown={markdown} theme={theme} settings={settings} />
      </div>
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings}
        updateSettings={updateSettings}
      />
    </div>
  );
}

export default App;