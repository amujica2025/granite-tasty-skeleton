// frontend/src/App.tsx (Journal integration snippet)

import React, { useState } from 'react';
import JournalPopup from './components/journal/JournalPopup';

export default function App() {
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalPrefill, setJournalPrefill] = useState<any>(null);

  // Example hooks (to be called from Watchlist / Alerts / Scanner)
  const openJournalFromWatchlist = (symbol: string) => {
    setJournalPrefill({ source: 'watchlist', symbol });
    setJournalOpen(true);
  };

  const openJournalFromAlertRule = (symbol: string) => {
    setJournalPrefill({ source: 'alerts-rule', symbol });
    setJournalOpen(true);
  };

  const openJournalFromAlertHistory = (symbol: string, note: string) => {
    setJournalPrefill({ source: 'alerts-history', symbol, note });
    setJournalOpen(true);
  };

  const openJournalFromScanner = (symbol: string) => {
    setJournalPrefill({ source: 'scanner', symbol });
    setJournalOpen(true);
  };

  return (
    <div>
      {/* your existing app layout here */}

      <JournalPopup
        open={journalOpen}
        onClose={() => setJournalOpen(false)}
        prefill={journalPrefill}
      />
    </div>
  );
}