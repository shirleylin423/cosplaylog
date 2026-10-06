import React from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import ThemeBackground from './components/ThemeBackground';
import HomePage from './components/HomePage';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <ThemeBackground />
        <HomePage />
        <Toaster position="top-center" />
      </div>
    </AppProvider>
  );
}

export default App;
