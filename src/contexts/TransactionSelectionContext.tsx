import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TransactionSelectionContextType {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  selectedCount: number;
}

const TransactionSelectionContext = createContext<TransactionSelectionContextType | undefined>(undefined);

export const TransactionSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  return (
    <TransactionSelectionContext.Provider
      value={{
        selectedIds,
        isSelectionMode,
        toggleSelection,
        selectAll,
        clearSelection,
        enterSelectionMode,
        exitSelectionMode,
        selectedCount: selectedIds.size,
      }}
    >
      {children}
    </TransactionSelectionContext.Provider>
  );
};

export const useTransactionSelection = (): TransactionSelectionContextType => {
  const context = useContext(TransactionSelectionContext);
  if (context === undefined) {
    throw new Error('useTransactionSelection must be used within a TransactionSelectionProvider');
  }
  return context;
};
