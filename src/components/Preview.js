import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify/dist/purify.min.js'; // 修改这里，使用完整路径
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';

export const Preview = ({ markdown, theme }) => {
  const previewRef = useRef(null);

  // 初始化mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' || theme === 'blue' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, [theme]);

  // 配置marked.js
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    });

    // 初次加载和内容变化时渲染预览
    renderPreview();
  }, [markdown, theme]);

  // 渲染预览内容
  const renderPreview = async () => {
    if (!previewRef.current) return;
    
    // 解析markdown为HTML
    const dirtyHtml = marked.parse(markdown);
    const cleanHtml = DOMPurify.sanitize(dirtyHtml);
    previewRef.current.innerHTML = cleanHtml;

    // 为代码块添加高亮
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });

    // 渲染mermaid图表
    const mermaidElements = previewRef.current.querySelectorAll('.language-mermaid');
    for (let i = 0; i < mermaidElements.length; i++) {
      const element = mermaidElements[i];
      const code = element.textContent;
      
      try {
        // 生成唯一的ID
        const id = `mermaid-${Date.now()}-${i}`;
        const { svg } = await mermaid.render(id, code);
        
        // 创建容器元素
        const container = document.createElement('div');
        container.className = 'mermaid-chart';
        container.innerHTML = svg;
        
        // 替换原始元素
        element.parentNode.replaceWith(container);
      } catch (error) {
        console.error('Mermaid渲染失败:', error);
        
        // 渲染失败时显示错误信息
        const errorElement = document.createElement('div');
        errorElement.className = 'mermaid-error';
        errorElement.textContent = `Mermaid图表渲染失败: ${error.message}`;
        element.parentNode.replaceWith(errorElement);
      }
    }
  };

  return (
    <div className="preview" ref={previewRef}></div>
  );
};