export const downloadBlob = (pdfBlob, fileName) => {
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
};
