import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify/dist/purify.min.js';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// 动态加载MathJax
const loadMathJax = () => {
  return new Promise((resolve, reject) => {
    if (window.MathJax) {
      resolve(window.MathJax);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js';
    script.async = true;
    script.onload = () => resolve(window.MathJax);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const Preview = ({ markdown, theme, settings }) => {
  const previewRef = useRef(null);

  // 初始化mermaid
  useEffect(() => {
    if (settings?.enableMermaid !== false) {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' || theme === 'blue' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
    }
  }, [theme, settings]);

  // 配置marked.js
  useEffect(() => {
    const markedOptions = {
      breaks: true,
      gfm: true,
    };

    if (settings?.enableCodeHighlight !== false) {
      markedOptions.highlight = function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      };
    }

    marked.setOptions(markedOptions);

    renderPreview();
  }, [markdown, theme, settings]);

  // 渲染预览内容
  const renderPreview = async () => {
    if (!previewRef.current) return;
    
    // 解析markdown为HTML
    const dirtyHtml = marked.parse(markdown);
    const cleanHtml = DOMPurify.sanitize(dirtyHtml);
    previewRef.current.innerHTML = cleanHtml;

    // Mermaid图表渲染 - 先处理Mermaid，避免代码高亮警告
    if (settings?.enableMermaid !== false) {
      const mermaidElements = previewRef.current.querySelectorAll('.language-mermaid');
      for (let i = 0; i < mermaidElements.length; i++) {
        const element = mermaidElements[i];
        const code = element.textContent;
        
        try {
          const id = `mermaid-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(id, code);
          
          const container = document.createElement('div');
          container.className = 'mermaid-chart';
          container.innerHTML = svg;
          
          element.parentNode.replaceWith(container);
        } catch (error) {
          console.error('Mermaid渲染失败:', error);
          
          const errorElement = document.createElement('div');
          errorElement.className = 'mermaid-error';
          errorElement.textContent = `Mermaid图表渲染失败: ${error.message}`;
          element.parentNode.replaceWith(errorElement);
        }
      }
    }

    // 代码高亮 - 排除已经处理过的Mermaid元素
    if (settings?.enableCodeHighlight !== false) {
      document.querySelectorAll('pre code').forEach((block) => {
        // 跳过已经处理过的Mermaid代码块
        if (!block.classList.contains('language-mermaid') && !block.closest('.mermaid-chart')) {
          try {
            hljs.highlightBlock(block);
          } catch (error) {
            console.warn('代码高亮失败:', error);
          }
        }
      });
    }

    // 数学公式渲染
    if (settings?.mathRenderer === 'katex') {
      // 渲染行内公式 $...$
      const inlineMathElements = previewRef.current.querySelectorAll('p, div, span');
      inlineMathElements.forEach(element => {
        const text = element.textContent;
        if (text.includes('$') && text.split('$').length > 2) {
          const html = element.innerHTML;
          const updatedHtml = html.replace(/\$(.+?)\$/g, (match, formula) => {
            try {
              const rendered = katex.renderToString(formula, { throwOnError: false });
              return `<span class="math-inline">${rendered}</span>`;
            } catch (error) {
              console.error('KaTeX行内公式渲染失败:', error);
              return match;
            }
          });
          element.innerHTML = updatedHtml;
        }
      });
  
      // 渲染块级公式 $$...$$
      const blockMathElements = previewRef.current.querySelectorAll('p');
      blockMathElements.forEach(element => {
        const text = element.textContent.trim();
        if (text.startsWith('$$') && text.endsWith('$$') && text.length > 4) {
          const formula = text.substring(2, text.length - 2);
          try {
            const rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            // 使用div替代span以确保块级公式正确显示
            element.innerHTML = `<div class="math-block">${rendered}</div>`;
          } catch (error) {
            console.error('KaTeX块级公式渲染失败:', error);
            element.innerHTML = `<div class="math-error">公式渲染失败: ${error.message}</div>`;
          }
        }
      });
      
      // 在KaTeX渲染完成后触发重排
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.style.overflow = 'hidden';
          previewRef.current.offsetHeight; // 触发重排
          previewRef.current.style.overflow = 'auto';
        }
      }, 0);
    } else if (settings?.mathRenderer === 'mathjax') {
      // 渲染MathJax公式
      try {
        const mathJax = await loadMathJax();
        if (mathJax && mathJax.typesetPromise) {
          mathJax.typesetPromise([previewRef.current]);
        }
      } catch (error) {
        console.error('MathJax加载失败:', error);
      }
    }
    
    // 数学公式渲染完成后的清理步骤
    if (settings?.mathRenderer === 'katex') {
      // 触发重排以确保公式正确渲染
      previewRef.current.offsetHeight;
    }
  };

  return (
    <div className="preview" ref={previewRef}></div>
  );
};