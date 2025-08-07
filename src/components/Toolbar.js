import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf/dist/jspdf.umd.min.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const Toolbar = ({ editorRef }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
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

  // 导出为PNG - 改进背景和分辨率
  const exportPNG = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    if (!preview) {
      console.error('找不到预览元素');
      return;
    }
    
    // 临时调整样式以确保完整渲染
    const originalStyle = {
      overflow: preview.style.overflow,
      height: preview.style.height,
      maxHeight: preview.style.maxHeight
    };
    
    preview.style.overflow = 'visible';
    preview.style.height = 'auto';
    preview.style.maxHeight = 'none';
    
    // 等待DOM更新后截图
    setTimeout(() => {
      html2canvas(preview, {
        backgroundColor: document.body.classList.contains('dark') ? '#1e1e1e' : '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: preview.scrollWidth,
        height: Math.max(preview.scrollHeight, preview.offsetHeight),
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'markdown-preview.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }).catch(err => {
        console.error('导出PNG失败:', err);
      }).finally(() => {
        preview.style.overflow = originalStyle.overflow;
        preview.style.height = originalStyle.height;
        preview.style.maxHeight = originalStyle.maxHeight;
      });
    }, 100);
  };

  // 导出为PDF - 提高分辨率和质量
  const exportPDF = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    if (!preview) {
      console.error('找不到预览元素');
      return;
    }
    
    const originalStyle = {
      overflow: preview.style.overflow,
      height: preview.style.height,
      maxHeight: preview.style.maxHeight
    };
    
    preview.style.overflow = 'visible';
    preview.style.height = 'auto';
    preview.style.maxHeight = 'none';
    
    setTimeout(() => {
      html2canvas(preview, {
        backgroundColor: document.body.classList.contains('dark') ? '#1e1e1e' : '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: preview.scrollWidth,
        height: Math.max(preview.scrollHeight, preview.offsetHeight),
        logging: false
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: false
        });
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
          heightLeft -= pageHeight;
        }
        
        pdf.save('markdown-preview.pdf');
      }).catch(err => {
        console.error('导出PDF失败:', err);
      }).finally(() => {
        preview.style.overflow = originalStyle.overflow;
        preview.style.height = originalStyle.height;
        preview.style.maxHeight = originalStyle.maxHeight;
      });
    }, 100);
  };

  // 导出为HTML
  const exportHTML = () => {
    setIsExportMenuOpen(false);
    const preview = document.querySelector('.preview');
    const htmlContent = preview ? preview.innerHTML : '';
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
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
    link.download = 'markdown-preview.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导出为MD
  const exportMD = () => {
    setIsExportMenuOpen(false);
    const editor = document.querySelector('.editor textarea');
    if (editor) {
      const blob = new Blob([editor.value || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'markdown-preview.md';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // 导出选项配置
  const exportOptions = [
    { id: 'png', label: '导出PNG', action: exportPNG },
    { id: 'pdf', label: '导出PDF', action: exportPDF },
    { id: 'html', label: '导出HTML', action: exportHTML },
    { id: 'md', label: '导出MD', action: exportMD }
  ];

  return (
    <div className="toolbar">
      <button onClick={() => insertAtCursor('# ')}>H1</button>
      <button onClick={() => insertAtCursor('## ')}>H2</button>
      <button onClick={() => insertAtCursor('### ')}>H3</button>
      <button onClick={() => insertAtCursor('**加粗文本**')}>B</button>
      <button onClick={() => insertAtCursor('*斜体文本*')}>I</button>
      <button onClick={() => insertAtCursor('~~删除线文本~~')}>S</button>
      <button onClick={() => insertAtCursor('> 引用文本\n')}>引用</button>
      <button onClick={() => insertAtCursor('\n```\n代码块\n```\n')}>代码块</button>
      <button onClick={() => insertAtCursor('\n---\n')}>分割线</button>
      <button onClick={() => insertAtCursor('- 列表项\n')}>无序列表</button>
      <button onClick={() => insertAtCursor('1. 列表项\n')}>有序列表</button>
      
      <div className="export-container" ref={exportMenuRef} style={{ marginLeft: 'auto' }}>
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
  );
};