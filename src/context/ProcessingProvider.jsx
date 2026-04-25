import { useState } from 'react';
import { ProcessingContext } from './ProcessingContext';

export const ProcessingProvider = ({ children }) => {
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [isProcessingHeic, setIsProcessingHeic] = useState(false);

  const isProcessing = isProcessingPDF || isProcessingHeic;

  return (
    <ProcessingContext.Provider
      value={{
        isProcessingPDF,
        setIsProcessingPDF,
        isProcessingHeic,
        setIsProcessingHeic,
        isProcessing,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
};
