import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
// 配置使用npm包，避免使用cdn资源，加快加载速度
loader.config({ monaco });
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);