/**
 * Unit tests for downloadBlob utility
 * Tests PDF download functionality
 */

import { downloadBlob } from './downloadBlob';

describe('downloadBlob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Download Functionality', () => {
    it('should call createObjectURL with the blob', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const fileName = 'test.pdf';

      downloadBlob(mockBlob, fileName);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should revoke the object URL after download', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const mockUrl = 'blob:http://localhost/mock-url';

      jest.mocked(global.URL.createObjectURL).mockReturnValueOnce(mockUrl);

      downloadBlob(mockBlob, 'test.pdf');

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('should handle PDF blobs correctly', () => {
      const pdfContent = new Uint8Array([
        0x25,
        0x50,
        0x44,
        0x46, // %PDF header
      ]);
      const mockBlob = new Blob([pdfContent], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'document.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle large PDF blobs', () => {
      const largeData = new Uint8Array(10 * 1024 * 1024);
      const mockBlob = new Blob([largeData], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'large-file.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle empty blobs', () => {
      const mockBlob = new Blob([], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'empty.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('File Naming', () => {
    it('should add _unlocked suffix to filename and keep .pdf extension', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      jest.mocked(global.URL.createObjectURL).mockImplementationOnce(() => {
        return `blob:http://localhost/${Math.random()}`;
      });

      const appendChildSpy = jest.spyOn(document.body, 'appendChild');

      downloadBlob(mockBlob, 'original.pdf');

      // The download link should have been created
      expect(appendChildSpy).toHaveBeenCalled();
      appendChildSpy.mockRestore();
    });

    it('should handle uppercase PDF extension', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'document.PDF');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle filenames without extension', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'document');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle filenames with multiple dots', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'my.report.final.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('DOM Handling', () => {
    it('should create a link element', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      const createElementSpy = jest.spyOn(document, 'createElement');

      downloadBlob(mockBlob, 'test.pdf');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      createElementSpy.mockRestore();
    });

    it('should append and remove the link from DOM', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      downloadBlob(mockBlob, 'test.pdf');

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should not leave link elements in DOM after download', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'test.pdf');

      const links = document.querySelectorAll('a');
      expect(links).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle filenames with special characters', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'file-with_special@chars.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should handle very long filenames', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      const longName = 'a'.repeat(200) + '.pdf';

      downloadBlob(mockBlob, longName);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should handle filenames with spaces', () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      downloadBlob(mockBlob, 'my important document.pdf');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });
});
