import React from "react";
import "./App.css";

import { AppProvider, useApp } from "./context/AppContext";

import ThemeBackground from "./components/ThemeBackground";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";

import { Toaster } from "./components/ui/sonner";


function AppContent() {
  const {
    user,
    authLoading,
  } = useApp();


  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner">
          ✦
        </div>

        <div>
          正在載入...
        </div>
      </div>
    );
  }


  return (
    <div className="App">

      <ThemeBackground />

      {user ? (
        <HomePage />
      ) : (
        <LoginPage />
      )}

      <Toaster
        position="top-center"
      />

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
