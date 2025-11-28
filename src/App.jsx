import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import { RecordPage } from './components/RecordPage';
import { HistoryPage } from './components/HistoryPage';
import { StatsPage } from './components/StatsPage';
import { SettingsPage } from './components/SettingsPage';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';

function App() {
  const [currentPage, setCurrentPage] = useState('record');

  // Simple router
  const renderPage = () => {
    switch (currentPage) {
      case 'record': return <RecordPage />;
      case 'history': return <HistoryPage />;
      case 'stats': return <StatsPage />;
      case 'settings': return <SettingsPage />;
      default: return <RecordPage />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      <Navbar activePage={currentPage} onNavigate={setCurrentPage} />
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#22c55e',
          color: '#000',
          fontWeight: 600,
        },
      }} />
    </div>
  );
}

export default App;
