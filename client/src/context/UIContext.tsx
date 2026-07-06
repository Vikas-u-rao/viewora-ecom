'use client';

import React, { createContext, useContext, useState } from 'react';

type UIContextType = {
  isInquiryOpen: boolean;
  openInquiry: () => void;
  closeInquiry: () => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const openInquiry = () => setIsInquiryOpen(true);
  const closeInquiry = () => setIsInquiryOpen(false);

  return (
    <UIContext.Provider value={{ isInquiryOpen, openInquiry, closeInquiry }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
