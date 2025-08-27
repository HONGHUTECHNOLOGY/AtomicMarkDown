import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf/dist/jspdf.umd.min.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 检测是否为移动设备 - 改为基于页面大小检测
const isMobileDevice = () => {
  return window.innerWidth < 768;
};

export const Toolbar = ({ editorRef, settings, markdown }) => {  // 添加markdown参数
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isChartMenuOpen, setIsChartMenuOpen] = useState(false);
  // 添加工具栏展开/收起状态
  const [isToolbarOpen, setIsToolbarOpen] = useState(!isMobileDevice());
  const exportMenuRef = useRef(null);
  const chartMenuRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
      if (chartMenuRef.current && !chartMenuRef.current.contains(event.target)) {
        setIsChartMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 在光标处插入文本的通用方法
  const insertAtCursor = (text) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  };

  // 插入不同类型的mermaid图表
  const insertMermaidChart = (chartType) => {
    setIsChartMenuOpen(false);
    let chartTemplate = '';
    
    switch (chartType) {
      case 'flowchart':
        chartTemplate = `
\`\`\`mermaid
flowchart TD
    A[开始] --> B[处理]
    B --> C{判断}
    C -->|是| D[结束]
    C -->|否| B
\`\`\`
`;
        break;
      case 'sequence':
        chartTemplate = `
\`\`\`mermaid
sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 请求
    B->>A: 响应
\`\`\`
`;
        break;
      case 'class':
        chartTemplate = `
\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog
\`\`\`
`;
        break;
      case 'state':
        chartTemplate = `
\`\`\`mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中
    处理中 --> 已完成
    处理中 --> 异常
    异常 --> 待处理
\`\`\`
`;
        break;
      case 'gantt':
        chartTemplate = `
\`\`\`mermaid
gantt
    title 项目进度
    dateFormat  YYYY-MM-DD
    section 任务
    任务1           :a1, 2024-01-01, 30d
    任务2           :after a1, 20d
\`\`\`
`;
        break;
      case 'pie':
        chartTemplate = `
\`\`\`mermaid
pie
    title 数据分布
    "类别A" : 30
    "类别B" : 20
    "类别C" : 50
\`\`\`
`;
        break;
      default:
        chartTemplate = `
\`\`\`mermaid
graph TD
    A[开始] --> B[结束]
\`\`\`
`;
    }
    
    insertAtCursor(chartTemplate);
  };

  // 插入表格模板
  const insertTable = () => {
    const tableTemplate = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
`;
    insertAtCursor(tableTemplate);
  };

  // 生成导出文件名的函数
  const generateFileName = (extension) => {
    const fileNameFormat = settings.exportFileName || 'timestamp';
    
    switch (fileNameFormat) {
      case 'title':
        // 从文档中提取标题（第一个H1标题）
        const preview = document.querySelector('.preview');
        if (preview) {
          const h1 = preview.querySelector('h1');
          if (h1 && h1.textContent.trim()) {
            return `${h1.textContent.trim()}.${extension}`;
          }
        }
        // 如果没有找到标题，使用默认名称
        return `markdown-preview.${extension}`;
      case 'custom':
        // 这里可以添加自定义文件名的逻辑
        // 暂时使用默认名称
        return `markdown-preview.${extension}`;
      case 'timestamp':
      default:
        // 使用时间戳
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        return `markdown-${timestamp}.${extension}`;
    }
  };

  // 手动保存到localStorage
  const saveToLocalStorage = () => {
    // 直接使用通过props传递的markdown内容
    localStorage.setItem('markdown', markdown);
    // 显示保存成功的提示
    alert('内容已保存到本地');
  };

  // 导出为PNG - 修复内容缺失问题
  const exportPNG = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    if (!preview) {
      console.error('找不到预览元素');
      return;
    }
    
    // 获取预览区域的实际背景色
    const getThemeBackgroundColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.backgroundColor || '#ffffff';
    };
    
    // 获取当前主题的文字颜色
    const getThemeTextColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.color || '#333333';
    };
    
    // 根据设置确定是否包含背景色
    const includeBackground = settings.includeBackground !== false; // 默认为true
    
    // 克隆预览区域以避免样式干扰
    const clone = preview.cloneNode(true);
    
    // 获取原始预览元素的所有计算样式
    const computedStyle = window.getComputedStyle(preview);
    let styleText = '';
    
    // 复制所有样式属性，除了背景色（根据设置决定）
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      const value = computedStyle.getPropertyValue(property);
      
      // 跳过背景色相关属性，我们会单独处理
      if (property.includes('background') && property !== 'background-attachment') {
        continue;
      }
      
      styleText += `${property}: ${value}; `;
    }
    
    // 根据设置添加背景色
    const backgroundColorStyle = includeBackground ? `background-color: ${getThemeBackgroundColor()};` : 'background-color: transparent;';
    
    // 计算实际内容尺寸，确保包含所有内容
    const originalWidth = preview.scrollWidth;
    const originalHeight = Math.max(preview.scrollHeight, preview.clientHeight);
    
    // 对于非常长的内容，可能需要特殊处理
    // 获取所有子元素的总高度
    let contentHeight = 0;
    const children = preview.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const rect = child.getBoundingClientRect();
      const computedChildStyle = window.getComputedStyle(child);
      const marginTop = parseFloat(computedChildStyle.marginTop) || 0;
      const marginBottom = parseFloat(computedChildStyle.marginBottom) || 0;
      contentHeight += rect.height + marginTop + marginBottom;
    }
    
    // 使用最大的高度值确保包含所有内容
    const actualHeight = Math.max(originalHeight, contentHeight, preview.offsetHeight);
    
    clone.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${originalWidth}px;
      height: ${actualHeight}px;
      ${styleText}
      ${backgroundColorStyle}
      padding: 20px;
      box-sizing: border-box;
      overflow: visible;
    `;
    
    document.body.appendChild(clone);
    
    // 确保所有图片和样式都已加载
    setTimeout(() => {
      // 根据设置确定PNG质量
      const pngQuality = settings.pngQuality || '2';
      let scale = 2; // 默认高清 (2x)
      
      switch (pngQuality) {
        case '1':
          scale = 1; // 标准 (1x)
          break;
        case '2':
          scale = 2; // 高清 (2x)
          break;
        case '3':
          scale = 3; // 超清 (3x)
          break;
        default:
          scale = 2;
      }
      
      // 根据设置确定html2canvas的背景色
      // 当不包含背景色时，明确设置为透明
      const backgroundColor = includeBackground ? getThemeBackgroundColor() : 'transparent';
      
      // 使用我们计算出的实际尺寸，而不是clone.scrollWidth/scrollHeight
      html2canvas(clone, {
        backgroundColor: backgroundColor,
        scale: scale,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: originalWidth,
        height: actualHeight,
        logging: false,
        // 确保包含所有子元素
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT';
        }
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = generateFileName('png');  // 使用生成的文件名
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }).catch(err => {
        console.error('导出PNG失败:', err);
      }).finally(() => {
        document.body.removeChild(clone);
      });
    }, 300);
  };
  
  // 导出为PDF - 修复内容缺失问题
  const exportPDF = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    if (!preview) {
      console.error('找不到预览元素');
      return;
    }
    
    // 获取预览区域的实际背景色
    const getThemeBackgroundColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.backgroundColor || '#ffffff';
    };
    
    const getThemeTextColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.color || '#333333';
    };
    
    // 将RGBA颜色转换为RGB或HEX格式，因为jsPDF不支持RGBA
    const convertRgbaToRgb = (rgbaColor) => {
      // 如果不是RGBA格式，直接返回
      if (!rgbaColor.startsWith('rgba')) {
        return rgbaColor;
      }
      
      // 解析RGBA值
      const match = rgbaColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (!match) {
        return '#ffffff'; // 默认返回白色
      }
      
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      // const a = parseFloat(match[4]); // 透明度值，这里我们忽略它
      
      // 返回RGB格式
      return `rgb(${r}, ${g}, ${b})`;
    };
    
    // 根据设置确定是否包含背景色
    const includeBackground = settings.includeBackground !== false; // 默认为true
    
    const clone = preview.cloneNode(true);
    
    // 获取原始预览元素的所有计算样式
    const computedStyle = window.getComputedStyle(preview);
    let styleText = '';
    
    // 复制所有样式属性，除了背景色（根据设置决定）
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      const value = computedStyle.getPropertyValue(property);
      
      // 跳过背景色相关属性，我们会单独处理
      if (property.includes('background') && property !== 'background-attachment') {
        continue;
      }
      
      styleText += `${property}: ${value}; `;
    }
    
    // 根据设置添加背景色
    const backgroundColorStyle = includeBackground ? `background-color: ${getThemeBackgroundColor()};` : 'background-color: transparent;';
    
    // 计算实际内容尺寸，确保包含所有内容
    const originalWidth = preview.scrollWidth;
    const originalHeight = Math.max(preview.scrollHeight, preview.clientHeight);
    
    // 对于非常长的内容，可能需要特殊处理
    // 获取所有子元素的总高度
    let contentHeight = 0;
    const children = preview.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const rect = child.getBoundingClientRect();
      const computedChildStyle = window.getComputedStyle(child);
      const marginTop = parseFloat(computedChildStyle.marginTop) || 0;
      const marginBottom = parseFloat(computedChildStyle.marginBottom) || 0;
      contentHeight += rect.height + marginTop + marginBottom;
    }
    
    // 使用最大的高度值确保包含所有内容
    const actualHeight = Math.max(originalHeight, contentHeight, preview.offsetHeight);
    
    clone.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${originalWidth}px;
      height: ${actualHeight}px;
      ${styleText}
      ${backgroundColorStyle}
      padding: 20px;
      box-sizing: border-box;
      overflow: visible;
    `;
    
    document.body.appendChild(clone);
    
    setTimeout(() => {
      // 根据设置确定html2canvas的背景色
      // 当不包含背景色时，明确设置为透明
      const backgroundColor = includeBackground ? getThemeBackgroundColor() : 'transparent';
      
      // 使用我们计算出的实际尺寸，而不是clone.scrollWidth/scrollHeight
      html2canvas(clone, {
        backgroundColor: backgroundColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: originalWidth,
        height: actualHeight,
        logging: false,
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT';
        }
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // 根据设置确定PDF页面大小
        const pdfPageSize = settings.pdfPageSize || 'a4';
        let format = 'a4';
        
        switch (pdfPageSize) {
          case 'a3':
            format = 'a3';
            break;
          case 'a4':
            format = 'a4';
            break;
          case 'letter':
            format = 'letter';
            break;
          default:
            format = 'a4';
        }
        
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: format,
          compress: false
        });
        
        // 根据页面大小设置图像尺寸
        let imgWidth, pageHeight;
        if (format === 'a3') {
          imgWidth = 297;
          pageHeight = 420;
        } else if (format === 'a4') {
          imgWidth = 210;
          pageHeight = 295;
        } else if (format === 'letter') {
          imgWidth = 216;
          pageHeight = 279;
        } else {
          imgWidth = 210;
          pageHeight = 295;
        }
        
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        // 修复：确保每一页都有正确的背景色
        // 转换背景色格式以确保jsPDF可以处理
        const pageBackgroundColor = includeBackground ? convertRgbaToRgb(getThemeBackgroundColor()) : 'transparent';
        
        // 使用jsPDF的分页功能
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // 如果内容高度超过页面高度，则进行分页
        if (imgHeight > pageHeight) {
          let pages = Math.ceil(imgHeight / pageHeight);
          for (let i = 1; i < pages; i++) {
            pdf.addPage();
            // 填充背景色
            pdf.setFillColor(pageBackgroundColor);
            pdf.rect(0, 0, imgWidth, pageHeight, 'F');
            // 添加内容，使用裁剪功能
            pdf.addImage(imgData, 'PNG', 0, -i * pageHeight, imgWidth, imgHeight);
          }
        }
        
        pdf.save(generateFileName('pdf'));  // 使用生成的文件名
      }).catch(err => {
        console.error('导出PDF失败:', err);
      }).finally(() => {
        document.body.removeChild(clone);
      });
    }, 300);
  };

  // 导出为HTML
  const exportHTML = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    
    // 获取预览区域的实际背景色
    const getThemeBackgroundColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.backgroundColor || '#ffffff';
    };
    
    // 获取当前主题的文字颜色
    const getThemeTextColor = () => {
      const computedStyle = window.getComputedStyle(preview);
      return computedStyle.color || '#333333';
    };
    
    // 根据设置确定是否包含背景色
    const includeBackground = settings.includeBackground !== false; // 默认为true
    
    // 根据设置确定背景样式
    // 当不包含背景色时，明确设置背景色为透明，但保持文字颜色
    const backgroundColorStyle = includeBackground ? `background-color: ${getThemeBackgroundColor()};` : 'background-color: transparent;';
    // 文字颜色始终保持，与背景色设置无关
    const textColorStyle = `color: ${getThemeTextColor()};`;
    
    const htmlContent = preview ? preview.innerHTML : '';
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      padding: 20px; 
      max-width: 800px; 
      margin: 0 auto; 
      ${backgroundColorStyle}
      ${textColorStyle}
    }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: rgba(175, 184, 193, 0.2); padding: 0.2em 0.4em; border-radius: 3px; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 1em 0; padding-left: 1em; color: #6a737d; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #dfe2e5; padding: 6px 13px; text-align: left; }
    th { background-color: #f6f8fa; font-weight: 600; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName('html');  // 使用生成的文件名
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // 导出为MD
  const exportMD = () => {
    setIsExportMenuOpen(false);
    const editor = document.querySelector('.editor textarea');
    if (editor) {
      // MD导出实际上不需要处理背景色，因为它只是纯文本
      // 但我们仍然使用generateFileName来生成文件名
      const blob = new Blob([editor.value || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('md');  // 使用生成的文件名
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  // 导出选项配置
  const exportOptions = [
    { id: 'png', label: '导出PNG', action: exportPNG },
    { id: 'pdf', label: '导出PDF', action: exportPDF },
    { id: 'html', label: '导出HTML', action: exportHTML },
    { id: 'md', label: '导出MD', action: exportMD }
  ];

  // 图表选项配置
  const chartOptions = [
    { id: 'flowchart', label: '流程图', action: () => insertMermaidChart('flowchart') },
    { id: 'sequence', label: '时序图', action: () => insertMermaidChart('sequence') },
    { id: 'class', label: '类图', action: () => insertMermaidChart('class') },
    { id: 'state', label: '状态图', action: () => insertMermaidChart('state') },
    { id: 'gantt', label: '甘特图', action: () => insertMermaidChart('gantt') },
    { id: 'pie', label: '饼图', action: () => insertMermaidChart('pie') }
  ];

  return (
    <div className="toolbar-wrapper">
      {/* 工具栏收起时显示的按钮 */}
      <button 
        className={`toolbar-show-button ${!isToolbarOpen ? 'show' : ''}`} 
        onClick={() => setIsToolbarOpen(true)}
      >
        ▼
      </button>
      
      {/* 工具栏 */}
      <div className={`toolbar ${isToolbarOpen ? 'open' : 'collapsed'}`}>
        {/* 工具栏内容 */}
        <div className="toolbar-content" style={{ display: isToolbarOpen ? 'flex' : 'none' }}>
          <button onClick={() => insertAtCursor('# ')}>H1</button>
          <button onClick={() => insertAtCursor('## ')}>H2</button>
          <button onClick={() => insertAtCursor('### ')}>H3</button>
          <button onClick={() => insertAtCursor('**加粗文本**')}>粗体</button>
          <button onClick={() => insertAtCursor('*斜体文本*')}>斜体</button>
          <button onClick={() => insertAtCursor('~~删除线文本~~')}>删除线</button>
          <button onClick={() => insertAtCursor('> 引用文本\n')}>引用</button>
          <button onClick={() => insertAtCursor('\n```\n代码块\n```\n')}>代码块</button>
          <button onClick={() => insertAtCursor('\n---\n')}>分割线</button>
          <button onClick={() => insertAtCursor('- 列表项\n')}>无序列表</button>
          <button onClick={() => insertAtCursor('1. 列表项\n')}>有序列表</button>
          <button onClick={insertTable}>表格</button>
          
          <div className="chart-container" ref={chartMenuRef}>
            <button 
              className="chart-btn" 
              onClick={() => setIsChartMenuOpen(!isChartMenuOpen)}
            >
              图表 ▼
            </button>
            <ul className={`chart-dropdown ${isChartMenuOpen ? 'show' : ''}`}>
              {chartOptions.map((option) => (
                <li key={option.id}>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      option.action();
                    }}
                  >
                    {option.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="export-container" ref={exportMenuRef}>
            {/* 保存按钮与导出按钮并排显示，添加右边距使其与其他按钮间距一致 */}
            <button 
              className="export-btn" 
              onClick={saveToLocalStorage}
              title="手动保存到本地"
              style={{ marginRight: '5px' }}
            >
              保存
            </button>
            <button 
              className="export-btn" 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            >
              导出 ▼
            </button>
            <ul className={`export-dropdown ${isExportMenuOpen ? 'show' : ''}`}>
              {exportOptions.map((option) => (
                <li key={option.id}>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      option.action();
                    }}
                  >
                    {option.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 添加切换按钮 */}
        <button 
          className={`toolbar-toggle ${isToolbarOpen ? 'show' : ''}`} 
          onClick={() => setIsToolbarOpen(false)}
        >
          ▲
        </button>
      </div>
    </div>
  );
};