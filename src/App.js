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

// 导出默认设置
export const defaultSettings = {
  autoSave: true,
  showLineNumbers: false,
  fontSize: '14',
  enableMermaid: true,
  enableCodeHighlight: true,
  mathRenderer: 'katex',
  pngQuality: '2',
  includeBackground: true,
  pdfPageSize: 'a4'
};

function App() {
  // 扩展主题选项
  const [theme, setTheme] = useState('light');
  const [markdown, setMarkdown] = useState('');
  const [settings, setSettings] = useState({}); // 初始化为空对象
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

  // 在初始化时从localStorage加载的useEffect中添加调试信息
  useEffect(() => {
    console.log('开始加载设置...');
    const savedMarkdown = localStorage.getItem('markdown');
    const savedTheme = localStorage.getItem('theme');
    const savedSettings = localStorage.getItem('settings');
    
    console.log('从localStorage读取的数据:', {
      savedMarkdown,
      savedTheme,
      savedSettings
    });
    
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    }
    if (savedTheme && availableThemes.find(t => t.id === savedTheme)) {
      setTheme(savedTheme);
      // 添加这一行来应用主题到body元素
      document.body.className = savedTheme;
    }
    
    // 设置默认值，如果localStorage中没有保存的设置，则使用默认设置
    const finalSettings = savedSettings ? 
      { ...defaultSettings, ...JSON.parse(savedSettings) } : 
      defaultSettings;
    
    console.log('最终使用的设置:', finalSettings);
    setSettings(finalSettings);
  }, []);

  // 自动保存到localStorage - 优化版本
  // 修改现有的自动保存useEffect
  useEffect(() => {
    // 检查是否启用自动保存
    if (settings.autoSave !== false) {
      const saveToLocalStorage = () => {
        localStorage.setItem('markdown', markdown);
      };
  
      // 使用防抖避免频繁保存
      const timeoutId = setTimeout(saveToLocalStorage, 2000);
  
      // 清理函数会在下次markdown变化时执行
      return () => clearTimeout(timeoutId);
    }
  }, [markdown, settings.autoSave]);

  // 保存设置到localStorage
  // 在保存设置到localStorage的useEffect中添加调试信息
  useEffect(() => {
    // 只有当settings不为空对象时才保存
    if (Object.keys(settings).length > 0) {
      console.log('设置已更新，正在保存到localStorage:', settings);
      localStorage.setItem('settings', JSON.stringify(settings));
    }
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
      <Toolbar editorRef={editorRef} settings={settings} markdown={markdown} />
      <div className="editor-container">
        <Editor 
          ref={editorRef}
          markdown={markdown} 
          setMarkdown={setMarkdown} 
          theme={theme} 
          settings={settings}
        />
        <Preview markdown={markdown} theme={theme} settings={settings} />  {/* 确保传递settings参数 */}
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