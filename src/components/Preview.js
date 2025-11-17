import React, { useEffect, useRef, forwardRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify/dist/purify.min.js';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { isScrollProcessing, setScrollProcessing, safeScrollSync } from '../utils/scrollSync';

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

// 使用forwardRef包装组件
export const Preview = forwardRef(({ markdown, theme, settings, onScroll }, ref) => {  // 添加ref参数
  const previewRef = ref || useRef(null);  // 如果没有传入ref，则使用内部ref
  const scrollHandlerRef = useRef(null); // 保存滚动处理函数的引用

  // 初始化mermaid
  useEffect(() => {
    if (settings?.enableMermaid !== false) {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default', // 修改蓝色主题使用default(浅色)主题
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
    }
  }, [theme, settings]);

  // 配置marked.js
  useEffect(() => {
    // 添加对数学公式的支持
    marked.use({
      extensions: [
        // 块级公式解析器 - 处理独占一行的\[...\]格式
        {
          name: 'blockMath',
          level: 'block',
          tokenizer(src) {
            const rule = /^\\\[(.*?)\\\]/s;
            const match = rule.exec(src);
            if (match) {
              return {
                type: 'blockMath',
                raw: match[0],
                text: match[1]?.trim(),
              };
            }
          },
          renderer(token) {
            // 为\[...\]格式的公式添加特殊标记，便于后续KaTeX渲染处理
            return `<p class="math-block-bracket">${token.text}</p>`;
          }
        },
        // 行内公式解析器 - 处理$...$和[...]格式
        {
          name: 'inlineMath',
          level: 'inline',
          start(src) {
            const dollarIndex = src.indexOf('$');
            const bracketIndex = src.indexOf('\\[');
            const parenIndex = src.indexOf('\\(');
            const indices = [dollarIndex, bracketIndex, parenIndex].filter(index => index !== -1);
            return indices.length > 0 ? Math.min(...indices) : -1;
          },
          tokenizer(src) {
            // 匹配$...$格式 - 使用^锚点确保从字符串开头匹配，避免重复
            const dollarRule = /^\$([^$]+)\$/;
            const dollarMatch = dollarRule.exec(src);
            if (dollarMatch) {
              return {
                type: 'inlineMath',
                raw: dollarMatch[0],
                text: dollarMatch[1]?.trim(),
                format: 'dollar'
              };
            }
            
            // 匹配\[...\]格式 - 使用^锚点确保从字符串开头匹配，避免重复
            const bracketRule = /^\\\[([^\]]+)\\\]/;
            const bracketMatch = bracketRule.exec(src);
            if (bracketMatch) {
              return {
                type: 'inlineMath',
                raw: bracketMatch[0],
                text: bracketMatch[1]?.trim(),
                format: 'bracket'
              };
            }
            
            // 匹配\(...\)格式 - 支持LaTeX标准的行内公式格式
            const parenRule = /^\\\((.+?)\\\)/;
            const parenMatch = parenRule.exec(src);
            if (parenMatch) {
              return {
                type: 'inlineMath',
                raw: parenMatch[0],
                text: parenMatch[1]?.trim(),
                format: 'paren'
              };
            }
          },
          renderer(token) {
            // 为行内公式添加特殊标记，便于后续KaTeX渲染处理
            return `<span class="math-inline" data-formula="${token.text}" data-format="${token.format}">${token.text}</span>`;
          }
        }
      ]
    });

    const markedOptions = {
      breaks: true,
      gfm: settings?.enableTaskLists !== false, // 根据设置动态启用GitHub Flavored Markdown
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
      // 渲染行内公式 - 处理通过marked扩展标记的公式
      const inlineMathElements = previewRef.current.querySelectorAll('span.math-inline');
      inlineMathElements.forEach(element => {
        let formula = element.getAttribute('data-formula');
        const format = element.getAttribute('data-format');
        
        if (formula) {
            // 直接使用Unicode点乘符号（⋅）替换"·"
            // 这样KaTeX会直接识别为点乘符号，不会解释为\cdotp
            formula = formula.replace(/·/g, '⋅');
            
            try {
              const rendered = katex.renderToString(formula, { 
                throwOnError: false,
                displayMode: false // 行内模式
              });
              element.innerHTML = rendered;
            } catch (error) {
              console.error('KaTeX行内公式渲染失败:', error);
              element.innerHTML = `<span class="math-error">公式渲染失败: ${error.message}</span>`;
            }
          }
      });
  
      // 渲染块级公式 $$...$$ 和 \[...\]
  // 首先处理通过marked.js扩展识别的\[...\]格式公式
  const bracketMathElements = previewRef.current.querySelectorAll('p.math-block-bracket');
  bracketMathElements.forEach(element => {
    let formula = element.textContent.trim();
    if (formula.length > 0) {
        // 直接使用Unicode点乘符号（⋅）替换"·"
        // 这样KaTeX会直接识别为点乘符号，不会解释为\cdotp
        formula = formula.replace(/·/g, '⋅');
        
        try {
          const rendered = katex.renderToString(formula, { 
            displayMode: true, 
            throwOnError: false
          });
          // 使用div替代span以确保块级公式正确显示
          element.innerHTML = `<div class="math-block">${rendered}</div>`;
        } catch (error) {
          console.error('KaTeX块级公式渲染失败:', error);
          element.innerHTML = `<div class="math-error">公式渲染失败: ${error.message}</div>`;
        }
      }
  });
  
  // 然后处理通过DOM检测识别的$$...$$和\[...\]格式公式
  const blockMathElements = previewRef.current.querySelectorAll('p');
  blockMathElements.forEach(element => {
    let text = element.textContent;
    
    // 处理 $$...$$ 格式 - 使用正则表达式匹配段落中的公式
    const doubleDollarMatches = text.match(/\$\$([^$]+)\$\$/g);
    if (doubleDollarMatches) {
      let updatedHtml = element.innerHTML;
      doubleDollarMatches.forEach(match => {
        let formula = match.substring(2, match.length - 2);
        // 直接使用Unicode点乘符号（⋅）替换"·"
        // 这样KaTeX会直接识别为点乘符号，不会解释为\cdotp
        formula = formula.replace(/·/g, '⋅');
        
        try {
          const rendered = katex.renderToString(formula, { 
            displayMode: true, 
            throwOnError: false
          });
          updatedHtml = updatedHtml.replace(match, `<div class="math-block">${rendered}</div>`);
        } catch (error) {
          console.error('KaTeX块级公式渲染失败:', error);
          updatedHtml = updatedHtml.replace(match, `<div class="math-error">公式渲染失败: ${error.message}</div>`);
        }
      });
      element.innerHTML = updatedHtml;
    }
    
    // 处理 \[...\] 格式 - 使用正则表达式匹配段落中的公式
    const bracketMatches = text.match(/\\\[([^\]]+)\\\]/g);
    if (bracketMatches) {
      let updatedHtml = element.innerHTML;
      bracketMatches.forEach(match => {
        let formula = match.substring(2, match.length - 2);
        // 直接使用Unicode点乘符号（⋅）替换"·"
        // 这样KaTeX会直接识别为点乘符号，不会解释为\cdotp
        formula = formula.replace(/·/g, '⋅');
        
        try {
          const rendered = katex.renderToString(formula, { 
            displayMode: true, 
            throwOnError: false
          });
          updatedHtml = updatedHtml.replace(match, `<div class="math-block">${rendered}</div>`);
        } catch (error) {
          console.error('KaTeX块级公式渲染失败:', error);
          updatedHtml = updatedHtml.replace(match, `<div class="math-error">公式渲染失败: ${error.message}</div>`);
        }
      });
      element.innerHTML = updatedHtml;
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

  // 修改handlePreviewScroll函数，使用useRef缓存最新的settings值
  const handlePreviewScroll = () => {
    // 直接检查最新的settings.syncScroll值
    // 修复：只有当settings.syncScroll明确为true时才启用同步滚动
    const isSyncScrollEnabled = settings && typeof settings === 'object' 
      ? (settings.syncScroll === true)
      : false; // 默认关闭同步滚动
    
    if (!isSyncScrollEnabled) return;
    
    safeScrollSync(() => {
      if (onScroll && previewRef.current) {
        const scrollTop = previewRef.current.scrollTop;
        const scrollHeight = previewRef.current.scrollHeight;
        const clientHeight = previewRef.current.clientHeight;
        
        const validScrollTop = Math.max(0, scrollTop || 0);
        const validScrollHeight = Math.max(1, scrollHeight || 1);
        const validHeight = Math.max(1, clientHeight || 1);
        
        onScroll({ 
          scrollTop: validScrollTop, 
          scrollHeight: validScrollHeight, 
          height: validHeight,
          source: 'preview' 
        });
      }
    });
  };

  // 正确管理滚动事件监听器的添加和移除
  useEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    // 先移除旧的监听器（如果存在）
    if (scrollHandlerRef.current) {
      previewElement.removeEventListener('scroll', scrollHandlerRef.current);
    }

    // 根据当前设置决定是否添加监听器
    // 修复：只有当settings.syncScroll明确为true时才启用同步滚动
    const isSyncScrollEnabled = settings && typeof settings === 'object' 
      ? (settings.syncScroll === true)
      : false; // 默认关闭同步滚动

    if (isSyncScrollEnabled) {
      // 保存当前的处理函数引用
      scrollHandlerRef.current = handlePreviewScroll;
      previewElement.addEventListener('scroll', handlePreviewScroll);
    }

    // 清理函数：移除监听器
    return () => {
      if (previewElement && scrollHandlerRef.current) {
        previewElement.removeEventListener('scroll', scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
    };
  }, [settings]); // 依赖settings，当设置变化时重新注册监听器

  // 渲染预览内容
  return (
    <div className="preview" ref={previewRef}></div>
  );
});

// 添加displayName以方便调试
Preview.displayName = 'Preview';