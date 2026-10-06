import React from 'react';
import './App.css';

import { AppProvider, useApp } from './context/AppContext';

import ThemeBackground from './components/ThemeBackground';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';

import { Toaster } from './components/ui/sonner';


function AppContent() {
  const { user, loading } = useApp();

  // 正在確認登入狀態
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        <div className="text-center">
          <div className="font-serif-tc text-xl font-bold">
            攪拌紀錄
          </div>

          <div className="font-deco text-[10px] tracking-[0.3em] mt-2 opacity-60">
            LOADING...
          </div>
        </div>
      </div>
    );
  }

  // 沒登入 → 登入 / 註冊
  if (!user) {
    return (
      <div className="App">
        <ThemeBackground />
        <LoginPage />
        <Toaster position="top-center" />
      </div>
    );
  }

  // 已登入 → 個人自己的 Cosplay 紀錄
  return (
    <div className="App">
      <ThemeBackground />
      <HomePage />
      <Toaster position="top-center" />
    </div>
  );
}


function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}


export default App;
