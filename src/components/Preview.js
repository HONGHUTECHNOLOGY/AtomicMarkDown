import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify/dist/purify.min.js'; // 修改这里，使用完整路径
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export const Preview = ({ markdown, theme }) => {
  const previewRef = useRef(null);

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
  }, [markdown]);

  // 渲染预览内容
  const renderPreview = () => {
    if (!previewRef.current) return;
    const cleanHtml = DOMPurify.sanitize(marked.parse(markdown));
    previewRef.current.innerHTML = cleanHtml;

    // 为代码块添加高亮
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });
  };

  return (
    <div className="preview" ref={previewRef}></div>
  );
};