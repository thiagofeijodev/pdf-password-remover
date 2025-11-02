import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

// Set up PDF.js worker
// Use the actual installed version from pdfjsLib.version
if (typeof window !== 'undefined') {
  // PDF.js 4.x uses .mjs files - use jsdelivr CDN which is reliable
  const pdfjsVersion = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

const STORAGE_KEY = 'pdfPasswordRemover_data';

async function renderAllPagesToCanvas(pdfDocument) {
  const numPages = pdfDocument.numPages;
  const pdf = new jsPDF();

  // Render each page and add to PDF
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality

    // Create a temporary canvas for rendering
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the PDF page to canvas
    await page.render({
      canvasContext,
      viewport,
    }).promise;

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (viewport.height * imgWidth) / viewport.width;

    if (pageNum === 1) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
  }

  return pdf;
}

export const usePDFPasswordRemover = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  // Load saved data from localStorage on mount
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
      const arrayBuffer = await file.arrayBuffer();

      // Create copies of the ArrayBuffer immediately to avoid detached buffer issues
      // PDF.js may transfer/detach buffers, so we work with copies from the start
      const bufferForPdfJs = arrayBuffer.slice(0);

      // Load PDF with password using PDF.js
      const loadingTask = pdfjsLib.getDocument({
        password: password,
        data: bufferForPdfJs,
      });

      const pdfDocument = await loadingTask.promise;

      // Render all pages to canvas and create new PDF
      const newPdf = await renderAllPagesToCanvas(pdfDocument);

      // Generate blob from the new PDF
      const pdfBlob = newPdf.output('blob');

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;

      // Use original filename with _unlocked suffix
      const originalName = fileName.replace(/\.pdf$/i, '');
      a.download = `${originalName}_unlocked.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      URL.revokeObjectURL(url);

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
