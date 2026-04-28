import { useMemo, useState } from 'react';
import { ProcessingContext } from './ProcessingContext';

export const ProcessingProvider = ({ children }) => {
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [isProcessingHeic, setIsProcessingHeic] = useState(false);

  const value = useMemo(
    () => ({
      isProcessingPDF,
      setIsProcessingPDF,
      isProcessingHeic,
      setIsProcessingHeic,
      isProcessing: isProcessingPDF || isProcessingHeic,
    }),
    [isProcessingPDF, isProcessingHeic],
  );

  return <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>;
};
