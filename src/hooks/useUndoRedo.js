import { useState, useCallback } from 'react';

export const useUndoRedo = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  
  const setState = useCallback((value) => {
    // If the new value is the same as the current one, do nothing
    if (JSON.stringify(value) === JSON.stringify(state)) {
      return;
    }
    
    // When a new state is set, we erase the "redo" history
    const newHistory = history.slice(0, currentIndex + 1);
    
    setHistory([...newHistory, value]);
    setCurrentIndex(newHistory.length);
  }, [currentIndex, history, state]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};