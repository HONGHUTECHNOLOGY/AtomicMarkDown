import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ isOpen, onClose, settings, updateSettings }) => {
  const [activeMenu, setActiveMenu] = useState('basic');
  const [isVisible, setIsVisible] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // 用于跟踪上一次活动菜单
  const [prevActiveMenu, setPrevActiveMenu] = useState(activeMenu);

  const menuItems = [
    { id: 'basic', label: '基本设置', icon: '⚙️' },
    { id: 'render', label: '渲染设置', icon: '🎨' },
    { id: 'export', label: '导出设置', icon: '📤' },
    { id: 'about', label: '关于我们', icon: 'ℹ️' }
  ];

  // 在useEffect中修改关闭处理逻辑
  useEffect(() => {
    if (isOpen) {
      // 打开时立即显示
      setIsVisible(true);
      setShowAnimation(true);
    } else {
      // 关闭时先应用closing类，再延迟隐藏
      setShowAnimation(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 与CSS动画时间保持一致
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // 监听活动菜单的变化
  useEffect(() => {
    if (activeMenu !== prevActiveMenu) {
      setShowAnimation(true);
      setPrevActiveMenu(activeMenu);
    }
  }, [activeMenu, prevActiveMenu]);
  
  // 在设置更新后关闭动画
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [settings, showAnimation]);
  
  if (!isVisible) return null;

  const handleCheckboxChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const handleSelectChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const handleMenuChange = (menuId) => {
    if (menuId !== activeMenu) {
      setActiveMenu(menuId);
      setShowAnimation(true);
    }
  };

  const renderBasicSettings = () => (
    <div className="settings-section">
      <h3>基本设置</h3>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.autoSave !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('autoSave', e.target.checked)}
          />
          <span className="setting-label">自动保存</span>
          <span className="setting-description">每30秒自动保存编辑内容</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.showLineNumbers !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('showLineNumbers', e.target.checked)}
          />
          <span className="setting-label">显示行号</span>
          <span className="setting-description">在编辑器左侧显示行号</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <span className="setting-label">字体大小</span>
          <select 
            value={settings.fontSize || '14'}
            onChange={(e) => handleSelectChange('fontSize', e.target.value)}
            className="setting-select"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <span className="setting-label">编辑器主题</span>
          <select 
            value={settings.editorTheme || 'default'}
            onChange={(e) => handleSelectChange('editorTheme', e.target.value)}
            className="setting-select"
          >
            <option value="default">默认</option>
            <option value="vs">VS Code</option>
            <option value="sublime">Sublime Text</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderRenderSettings = () => (
    <div className="settings-section">
      <h3>渲染设置</h3>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.enableMermaid !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('enableMermaid', e.target.checked)}
          />
          <span className="setting-label">启用Mermaid图表</span>
          <span className="setting-description">支持流程图、时序图等图表渲染</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.enableCodeHighlight !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('enableCodeHighlight', e.target.checked)}
          />
          <span className="setting-label">启用代码高亮</span>
          <span className="setting-description">为代码块添加语法高亮</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.enableTaskLists !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('enableTaskLists', e.target.checked)}
          />
          <span className="setting-label">启用任务列表</span>
          <span className="setting-description">支持GitHub风格的任务列表</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <span className="setting-label">数学公式渲染</span>
          <select 
            value={settings.mathRenderer || 'none'}
            onChange={(e) => handleSelectChange('mathRenderer', e.target.value)}
            className="setting-select"
          >
            <option value="none">不启用</option>
            <option value="katex">KaTeX(LaTeX)</option>
            <option value="mathjax">MathJax</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderExportSettings = () => (
    <div className="settings-section">
      <h3>导出设置</h3>
      <div className="setting-item">
        <label>
          <span className="setting-label">PNG质量</span>
          <select 
            value={settings.pngQuality || '2'}
            onChange={(e) => handleSelectChange('pngQuality', e.target.value)}
            className="setting-select"
          >
            <option value="1">标准 (1x)</option>
            <option value="2">高清 (2x)</option>
            <option value="3">超清 (3x)</option>
          </select>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings.includeBackground !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('includeBackground', e.target.checked)}
          />
          <span className="setting-label">包含背景色</span>
          <span className="setting-description">导出时包含当前主题的背景色</span>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <span className="setting-label">PDF页面大小</span>
          <select 
            value={settings.pdfPageSize || 'a4'}
            onChange={(e) => handleSelectChange('pdfPageSize', e.target.value)}
            className="setting-select"
          >
            <option value="a4">A4</option>
            <option value="a3">A3</option>
            <option value="letter">Letter</option>
          </select>
        </label>
      </div>
      <div className="setting-item">
        <label>
          <span className="setting-label">导出文件名格式</span>
          <select 
            value={settings.exportFileName || 'timestamp'}
            onChange={(e) => handleSelectChange('exportFileName', e.target.value)}
            className="setting-select"
          >
            <option value="timestamp">时间戳</option>
            <option value="title">文档标题</option>
            <option value="custom">自定义</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderAboutSettings = () => (
    <div className="settings-section">
      <h3>关于我们</h3>
      <div className="about-content">
        <div className="about-header">
          <h4>原子Markdown编辑器</h4>
          <p className="version">版本 1.1.0 Beta</p>
        </div>
        
        <div className="version-info">
          <h4>功能特性</h4>
          <ul className="feature-list">
            <li>实时预览与编辑</li>
            <li>多种主题切换</li>
            <li>Mermaid图表支持</li>
            <li>代码高亮</li>
            <li>KateX(LateX)数学公式渲染</li>
            <li>多种格式导出</li>
            <li>自动保存功能</li>
          </ul>
        </div>
        
        <div className="about-links">
          <p>
            <strong>开发者：</strong>鸿鹄科技团队
          </p>
          <p>
            <strong>技术栈：</strong>React 19 + Monaco Editor + Mermaid
          </p>
          <p>
            <a href="https://gitee.com/honghutechnology/AtomicMarkDown" 
               target="_blank" 
               rel="noopener noreferrer"
               className="project-link">
              🌟 访问项目主页
            </a>
          </p>
          <p>
            <a href="https://github.com" 
               target="_blank" 
               rel="noopener noreferrer"
               className="github-link">
              📦 查看源代码
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    const contentMap = {
      basic: renderBasicSettings,
      render: renderRenderSettings,
      export: renderExportSettings,
      about: renderAboutSettings
    };
    
    const ContentComponent = contentMap[activeMenu] || renderBasicSettings;
    return <div className={showAnimation ? "settings-section animated" : "settings-section"}>
      <ContentComponent />
    </div>;
  };

  return (
    <div className={`settings-overlay ${isOpen ? 'open' : 'closing'}`} onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>设置</h2>
          <button className="close-btn" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className="settings-body">
          <nav className="settings-sidebar">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handleMenuChange(item.id)}
                aria-current={activeMenu === item.id ? 'page' : undefined}
              >
                <span className="menu-icon" aria-hidden="true">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </button>
            ))}
          </nav>
          <main className="settings-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;