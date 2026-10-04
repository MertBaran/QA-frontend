import React, { createContext, useContext, useState, useCallback } from 'react';
import SettingsModal from '../components/ui/SettingsModal';

interface SettingsModalContextValue {
  openSettingsModal: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextValue | null>(null);

export const useSettingsModal = () => {
  const ctx = useContext(SettingsModalContext);
  return ctx;
};

export const SettingsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const openSettingsModal = useCallback(() => {
    setOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <SettingsModalContext.Provider value={{ openSettingsModal }}>
      {children}
      <SettingsModal open={open} onClose={closeSettingsModal} />
    </SettingsModalContext.Provider>
  );
};
