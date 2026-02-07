import { createContext, useContext, useState } from 'react';

const ProcessingContext = createContext();

export const ProcessingProvider = ({ children }) => {
  const [isPDFProcessing, setIsPDFProcessing] = useState(false);
  const [isHeicProcessing, setIsHeicProcessing] = useState(false);

  const isProcessing = isPDFProcessing || isHeicProcessing;

  return (
    <ProcessingContext.Provider
      value={{
        isPDFProcessing,
        setIsPDFProcessing,
        isHeicProcessing,
        setIsHeicProcessing,
        isProcessing,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
};
