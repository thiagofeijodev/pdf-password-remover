import { useState, useEffect } from 'react';
import { createPDFObject } from '../utils/createPDFObject';
import { toPDFDocument } from '../utils/toPDFDocument';
import { downloadBlob } from '../utils/downloadBlob';
import { createPDFBuffer } from '../utils/createPDFBuffer';

const STORAGE_KEY = 'pdfPasswordRemover_data';

export const usePDFPasswordRemover = (processPDFWithWasm) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

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
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setError('');

    // Save to localStorage as base64
    try {
      const encodedPassword = btoa(newPassword);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ password: encodedPassword }));
    } catch (e) {
      console.warn('Failed to save password to localStorage:', e);
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

    setIsProcessing(true);
    setError('');

    try {
      const pdfBuffer = await createPDFBuffer(file);

      if (processPDFWithWasm) {
        const newPdf = await processPDFWithWasm(pdfBuffer, password);

        // download the new PDF without password
        downloadBlob(newPdf, fileName);
      } else {
        // create PDF.js document object with password
        const pdfDocument = await createPDFObject(pdfBuffer, password);

        // convert PDF to new PDF without password
        const newPdf = await toPDFDocument(pdfDocument);

        // download the new PDF without password
        downloadBlob(newPdf, fileName);
      }

      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      if (err.message.includes('password') || err.message.includes('PasswordException')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Error processing PDF: ' + err.message);
      }
    }
  };

  return {
    file,
    password,
    isProcessing,
    error,
    fileName,
    handleFileChange,
    handlePasswordChange,
    handleRemovePassword,
  };
};
