import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { RecordPage } from './components/RecordPage';
import { HistoryPage } from './components/HistoryPage';
import { StatsPage } from './components/StatsPage';
import { SettingsPage } from './components/SettingsPage';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

function App() {
  const [currentPage, setCurrentPage] = useState('record');

  const renderPage = () => {
    const pages = {
      record: <RecordPage key="record" />,
      history: <HistoryPage key="history" />,
      stats: <StatsPage key="stats" />,
      settings: <SettingsPage key="settings" />
    };
    return pages[currentPage];
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              paddingBottom: '80px' // Space for navbar
            }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <Navbar activePage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;
