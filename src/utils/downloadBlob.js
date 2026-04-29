export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // If a filename was provided, respect it for non-PDF blobs.
  // Preserve previous behavior for PDF blobs (append _unlocked.pdf).
  if (fileName) {
    if (blob && blob.type === 'application/pdf') {
      const originalName = fileName.replace(/\.pdf$/i, '');
      a.download = `${originalName}_unlocked.pdf`;
    } else {
      a.download = fileName;
    }
  } else {
    // Fallback: derive extension from MIME type when possible
    const ext = blob && blob.type ? blob.type.split('/').pop() : 'bin';
    a.download = `download.${ext}`;
  }

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};
