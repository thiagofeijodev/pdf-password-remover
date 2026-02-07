import { useState } from 'react';
import { ProcessingContext } from './index';

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
