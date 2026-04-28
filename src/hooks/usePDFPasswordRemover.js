import { useState, useEffect } from 'react';
import { createSafeBuffer } from '../utils/createSafeBuffer';
import { downloadBlob } from '../utils/downloadBlob';
import { useProcessing } from '../context/ProcessingContext';

const STORAGE_KEY = 'pdfPasswordRemover_data';

export const usePDFPasswordRemover = (processPDF) => {
  const { isProcessingPDF, setIsProcessingPDF } = useProcessing();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [savePassword, setSavePassword] = useState(true);

  // Load last used password from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { password: savedPassword } = JSON.parse(saved);
        if (savedPassword) {
          try {
            const decodedPassword = atob(savedPassword);
            setPassword(decodedPassword);
          } catch (e) {
            console.warn('Failed to decode saved password:', e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
      setSuccessMessage('');
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setError('');

    // Save to localStorage as base64 if savePassword is enabled
    try {
      if (savePassword) {
        const encodedPassword = btoa(newPassword);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ password: encodedPassword }));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ password: '' }));
      }
    } catch (e) {
      console.warn('Failed to save password to localStorage:', e);
    }
  };

  const handleSavePasswordChange = (e) => {
    const isChecked = e.target.checked;
    setSavePassword(isChecked);

    // Clear password from localStorage if unchecking
    try {
      if (!isChecked) {
        setPassword('');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ password: '' }));
      }
    } catch (e) {
      console.warn('Failed to update localStorage:', e);
    }
  };

  const handleRemovePassword = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (!password) {
      setError('Please enter the PDF password');
      return;
    }

    setIsProcessingPDF(true);
    setError('');
    setSuccessMessage('');

    try {
      const pdfDocument = await createSafeBuffer(file);
      const newPdf = await processPDF(pdfDocument, password);
      downloadBlob(newPdf, fileName);
      setSuccessMessage(`Password removed successfully! File downloaded: ${fileName}`);
    } catch (err) {
      if (err.message.includes('password') || err.message.includes('PasswordException')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Error processing PDF: ' + err.message);
      }
    } finally {
      setIsProcessingPDF(false);
    }
  };

  return {
    file,
    password,
    isProcessing: isProcessingPDF,
    successMessage,
    error,
    fileName,
    savePassword,
    handleFileChange,
    handlePasswordChange,
    handleSavePasswordChange,
    handleRemovePassword,
  };
};
