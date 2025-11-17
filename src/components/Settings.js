import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';
import { defaultSettings } from '../App'; // 从App.js导入默认设置

const Settings = ({ isOpen, onClose, settings, updateSettings, theme }) => {
  const [activeMenu, setActiveMenu] = useState('basic');
  const [isVisible, setIsVisible] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  // 添加一个状态来跟踪是否显示菜单列表（移动端二级菜单效果）
  const [showMenuList, setShowMenuList] = useState(true);
  
  // 用于跟踪上一次活动菜单
  const [prevActiveMenu, setPrevActiveMenu] = useState(activeMenu);

  const menuItems = [
    { id: 'basic', label: '基本设置', icon: '' },
    { id: 'render', label: '渲染设置', icon: '' },
    { id: 'export', label: '导出设置', icon: '' },
    { id: 'backup', label: '备份与恢复', icon: '' }, // 修改这里
    { id: 'about', label: '关于我们', icon: '' }
  ];

  // 在useEffect中修改关闭处理逻辑
  useEffect(() => {
    if (isOpen) {
      // 打开时立即显示
      setIsVisible(true);
      setShowAnimation(true);
      // 默认显示菜单列表
      setShowMenuList(true);
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
    // 移除条件判断，使每次点击都能正常切换
    setActiveMenu(menuId);
    setShowAnimation(true);
    // 在移动端，点击菜单项后进入具体设置页面
    if (window.innerWidth <= 768) {
      setShowMenuList(false);
    }
  };

  // 返回菜单列表的函数
  const handleBackToMenu = () => {
    setShowMenuList(true);
  };

  // 渲染菜单列表（移动端二级菜单的第一级）
  const renderMenuList = () => (
    <div className="menu-list">
      <h3>设置选项</h3>
      <div className="menu-grid">
        {menuItems.map(item => (
          <button
            key={item.id}
            className="menu-grid-item"
            onClick={() => handleMenuChange(item.id)}
          >
            <span className="menu-grid-text">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

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
          <input 
            type="checkbox" 
            checked={settings.syncScroll !== false}  // 修改这里
            onChange={(e) => handleCheckboxChange('syncScroll', e.target.checked)}
          />
          <span className="setting-label">同步滚动</span>
          <span className="setting-description">编辑区域和预览区域同步滚动</span>
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

  const renderImportExportSettings = () => (
    <div className="settings-section">
      <h3>备份与恢复</h3> {/* 修改这里 */}
      <div className="setting-item">
        <div className="setting-label">导出配置</div>
        <p className="setting-description">将当前设置导出为配置文件，便于在其他设备上使用</p>
        <button 
          className="export-btn"
          onClick={() => {
            // 创建配置文件
            const configData = {
              settings: settings,
              exportDate: new Date().toISOString(),
              version: '1.4.0'
            };
            
            // 创建并下载文件
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "atomic-markdown-config.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
        >
          导出配置
        </button>
      </div>
      <div className="setting-item">
        <div className="setting-label">导入配置</div>
        <p className="setting-description">从配置文件导入设置，覆盖当前配置</p>
        <input 
          type="file" 
          accept=".json" 
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const configData = JSON.parse(event.target.result);
                  if (configData.settings) {
                    updateSettings(configData.settings);
                    alert('配置导入成功！');
                  } else {
                    alert('配置文件格式不正确！');
                  }
                } catch (error) {
                  alert('配置文件解析失败：' + error.message);
                }
              };
              reader.readAsText(file);
            }
          }}
          style={{ display: 'none' }}
          id="import-config-input"
        />
        <button 
          className="import-btn"
          onClick={() => document.getElementById('import-config-input').click()}
        >
          导入配置
        </button>
      </div>
      {/* 添加恢复默认设置功能 */}
      <div className="setting-item">
        <div className="setting-label">恢复默认设置</div>
        <p className="setting-description">将所有设置恢复为默认值</p>
        <button 
          className="import-btn"  // 使用现有的import-btn样式
          onClick={() => {
            // 确认对话框
            if (window.confirm('确定要恢复默认设置吗？这将覆盖您当前的所有设置。')) {
              // 使用从App.js导入的默认设置
              updateSettings(defaultSettings);
              alert('已恢复默认设置！');
            }
          }}
        >
          恢复默认设置
        </button>
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
          <p className="version">版本 1.4.0</p>
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
            <li>同步滚动功能</li>
          </ul>
        </div>
        
        <div className="about-links">
          <p>
            <strong>开发者：</strong>鸿鹄科技
          </p>
          <p>
            <strong>技术栈：</strong>React 19 + Monaco Editor + Mermaid + KateX
          </p>
          <p>
            <a href="https://gitee.com/honghutechnology/AtomicMarkDown" 
               target="_blank" 
               rel="noopener noreferrer"
               className="gitee-link">
              🌟 Gitee项目地址
            </a>
          </p>
          <p>
            <a href="https://github.com/HONGHUTECHNOLOGY/AtomicMarkDown" 
               target="_blank" 
               rel="noopener noreferrer"
               className="github-link">
              🌟 Github项目地址
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  // 修改renderContent函数
  const renderContent = () => {
    // 在移动端，根据showMenuList状态决定显示菜单列表还是具体设置
    if (window.innerWidth <= 768 && showMenuList) {
      return <div className={showAnimation ? "settings-section animated" : "settings-section"}>
        {renderMenuList()}
      </div>;
    }
    
    const contentMap = {
      basic: renderBasicSettings,
      render: renderRenderSettings,
      export: renderExportSettings,
      backup: renderImportExportSettings,
      about: renderAboutSettings
    };
    
    const ContentComponent = contentMap[activeMenu] || renderBasicSettings;
    return <div className={showAnimation ? "settings-section animated" : "settings-section"}>
      <ContentComponent />
    </div>;
  };
  
  // 修改返回的JSX
  return (
    <div className={`settings-overlay ${isOpen ? 'open' : 'closing'} ${theme}`} onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          {/* 在移动端且不在菜单列表时，显示返回按钮 */}
          {window.innerWidth <= 768 && !showMenuList ? (
            <button className="back-btn" onClick={handleBackToMenu} aria-label="返回">←</button>
          ) : (
            <h2>设置</h2>
          )}
          <button className="close-btn" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className="settings-body">
          {/* 在非移动端或显示菜单列表时，显示侧边栏 */}
          {(window.innerWidth > 768 || (window.innerWidth <= 768 && showMenuList)) && (
            window.innerWidth > 768 ? (
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
            ) : (
              // 在移动端且显示菜单列表时，不显示侧边栏，而是在内容区域显示菜单列表
              null
            )
          )}
          <main className="settings-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;