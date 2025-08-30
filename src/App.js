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
import { isScrollProcessing, setScrollProcessing, safeScrollSync } from './utils/scrollSync';

// 导出默认设置
export const defaultSettings = {
  autoSave: true,
  showLineNumbers: false,
  syncScroll: false, // 修改默认值为false，使同步滚动默认关闭
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
  const previewRef = useRef(null);
  
  // 添加滚动同步状态
  const scrollState = useRef({
    isSyncing: false,
    source: null,
    lastSyncTime: 0 // 新增：记录最后一次同步的时间戳
  });

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

  // 在现有的useState hooks后添加
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  
  // 添加屏幕尺寸变化的监听器
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 添加鼠标移动监听器来实现光晕效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      const editorContainer = document.querySelector('.editor-container');
      if (!editorContainer) return;
      
      // 获取鼠标在编辑器容器内的位置
      const rect = editorContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 检查鼠标是否在编辑器容器内
      const isInside = mouseX >= 0 && mouseX <= rect.width && 
                     mouseY >= 0 && mouseY <= rect.height;
      
      // 更新光晕位置
      const glowElement = document.querySelector('.mouse-glow');
      if (glowElement) {
        if (isInside) {
          glowElement.style.left = mouseX + 'px';
          glowElement.style.top = mouseY + 'px';
          glowElement.classList.add('visible');
        } else {
          glowElement.classList.remove('visible');
        }
      }
    };

    // 创建光晕元素
    const createGlowElement = () => {
      const glowElement = document.createElement('div');
      glowElement.className = 'mouse-glow';
      
      // 使用CSS中定义的光晕样式，不再硬编码背景
      // 背景样式现在完全由CSS控制
      
      const editorContainer = document.querySelector('.editor-container');
      if (editorContainer) {
        editorContainer.appendChild(glowElement);
      }
    };

    // 初始化光晕元素
    createGlowElement();
    
    // 添加鼠标移动事件监听
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const glowElement = document.querySelector('.mouse-glow');
      if (glowElement) {
        glowElement.remove();
      }
    };
  }, [theme]); // 依赖theme，当主题变化时重新创建光晕元素
  
  // 处理滚动同步 - 改进的防循环触发机制
  const handleScroll = ({ scrollTop, scrollHeight, height, source }) => {
    // 检查同步滚动设置，如果关闭则直接返回
    if (settings && settings.syncScroll === false) {
      // 确保同步状态被正确重置
      scrollState.current.isSyncing = false;
      scrollState.current.source = null;
      return; // 立即返回，不执行后续同步逻辑
    }
    
    // 使用更精确的防循环机制 - 检查是否正在处理来自同一源的滚动
    if (scrollState.current.isSyncing) {
      return;
    }
    
    // 标记正在同步
    scrollState.current.isSyncing = true;
    scrollState.current.source = source;
    
    try {
      // 确保所有值都是有效数字
      const validScrollTop = Math.max(0, Number(scrollTop) || 0);
      const validScrollHeight = Math.max(1, Number(scrollHeight) || 1);
      const validHeight = Math.max(1, Number(height) || 1);
      
      // 计算滚动比例
      let scrollRatio;
      // 关键修复：移除重复计算，统一使用正确的滚动比例计算方法
      const maxScroll = Math.max(0, validScrollHeight - validHeight);
      
      if (maxScroll === 0) {
        scrollRatio = Math.min(1, validScrollTop / validHeight);
      } else {
        scrollRatio = Math.max(0, Math.min(1, validScrollTop / maxScroll));
      }
      
      // 实现单向滚动同步
      if (source === 'editor') {
        if (!previewRef.current) {
          return;
        }
        
        try {
          // 从编辑器同步到预览区 - 使用理论内容高度计算滚动比例
          const previewScrollHeight = Math.max(1, previewRef.current.scrollHeight || 0);
          const previewHeight = Math.max(1, previewRef.current.clientHeight || 0);
          const previewMaxScroll = Math.max(0, previewScrollHeight - previewHeight);
          
          // 使用相同的滚动比例计算逻辑
          let previewScrollTop;
          if (previewMaxScroll > 0) {
            previewScrollTop = scrollRatio * previewMaxScroll;
          } else {
            previewScrollTop = scrollRatio * previewScrollHeight;
          }
          
          // 确保滚动位置在有效范围内
          previewScrollTop = Math.max(0, Math.min(previewScrollTop, previewMaxScroll > 0 ? previewMaxScroll : previewScrollHeight));
          
          previewRef.current.scrollTop = previewScrollTop;
        } finally {
          // 记录同步完成时间
          scrollState.current.lastSyncTime = Date.now();
        }
      } else if (source === 'preview' && editorRef.current) {
        // 检查是否在短时间内刚完成同步，防止循环触发
        if (Date.now() - scrollState.current.lastSyncTime < 100) {
          return;
        }
        
        // 从预览区同步到编辑器 - 使用与编辑区到预览区相同的计算方法
        const editorScrollHeight = Math.max(1, editorRef.current.getScrollHeight() || 1);
        const editorHeight = Math.max(1, editorRef.current.getClientHeight() || 300);
        const editorMaxScroll = Math.max(0, editorScrollHeight - editorHeight);
        
        // 使用相同的滚动比例计算逻辑
        let editorScrollTop;
        if (editorMaxScroll > 0) {
          editorScrollTop = scrollRatio * editorMaxScroll;
        } else {
          editorScrollTop = scrollRatio * editorScrollHeight;
        }
        
        // 确保滚动位置在有效范围内
        editorScrollTop = Math.max(0, Math.min(editorScrollTop, editorMaxScroll > 0 ? editorMaxScroll : editorScrollHeight));
        
        // 直接设置编辑器滚动位置，不触发滚动事件
        editorRef.current.setScrollTop(editorScrollTop);
      }
    } finally {
      // 重置同步状态 - 缩短超时时间到20ms
      setTimeout(() => {
        scrollState.current.isSyncing = false;
        scrollState.current.source = null;
      }, 20);
    }
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
          onScroll={handleScroll} // 添加滚动事件处理
        />
        <Preview 
          ref={previewRef}
          markdown={markdown} 
          theme={theme} 
          settings={settings} 
          onScroll={handleScroll} // 添加滚动事件处理
        />  {/* 确保传递settings参数 */}
      </div>
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings}
        updateSettings={updateSettings}
        theme={theme}
      />
    </div>
  );
}

export default App;