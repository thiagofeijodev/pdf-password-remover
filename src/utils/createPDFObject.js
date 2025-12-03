import * as pdfjsLib from 'pdfjs-dist';

export const createPDFObject = async (file, password) => {
  // Load PDF with password using PDF.js
  const loadingTask = pdfjsLib.getDocument({
    password: password,
    data: file,
  });

  const pdfDocument = await loadingTask.promise;

  return pdfDocument;
};
