/**
 * Unit tests for App component
 * Tests file input, password input, form submission, and error states
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the hooks
jest.mock('./hooks/usePdfiumPDFRemover');
jest.mock('./hooks/usePDFPasswordRemover');
jest.mock('./utils/createGoogleTag');
jest.mock('../public/logo.png', () => 'logo.png');

describe('App Component', () => {
  const mockUsePdfiumPDFRemover = require('./hooks/usePdfiumPDFRemover').usePdfiumPDFRemover;
  const mockUsePDFPasswordRemover = require('./hooks/usePDFPasswordRemover').usePDFPasswordRemover;
  const mockCreateGoogleTag = require('./utils/createGoogleTag').createGoogleTag;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUsePdfiumPDFRemover.mockReturnValue({
      processPDFWithPdfium: jest.fn(async (pdfData) => {
        return new Blob([pdfData], { type: 'application/pdf' });
      }),
      isLoading: false,
      isPdfiumAvailable: true,
    });

    mockUsePDFPasswordRemover.mockReturnValue({
      password: '',
      isProcessing: false,
      error: '',
      fileName: '',
      file: null,
      savePassword: true,
      handleFileChange: jest.fn(),
      handlePasswordChange: jest.fn(),
      handleSavePasswordChange: jest.fn(),
      handleRemovePassword: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the main app container', () => {
      render(<App />);
      expect(screen.getByAltText('PDF Password Remover Logo')).toBeInTheDocument();
    });

    it('should render the title', () => {
      render(<App />);
      expect(
        screen.getByRole('heading', { level: 1, name: /PDF Password Remover/i }),
      ).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<App />);
      expect(
        screen.getByText(/Upload a password-protected PDF and remove its password protection/i),
      ).toBeInTheDocument();
    });

    it('should render file input field', () => {
      render(<App />);
      const fileInput = screen.getByLabelText(/Select PDF File/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.pdf,application/pdf');
    });

    it('should render password input field', () => {
      render(<App />);
      const passwordInput = screen.getByLabelText(/PDF Password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render save password checkbox', () => {
      render(<App />);
      const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('should render the submit button', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Remove Password & Download/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('File Input Interactions', () => {
    it('should call handleFileChange when file is selected', async () => {
      const user = userEvent.setup();
      const mockHandleFileChange = jest.fn();

      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: '',
        file: null,
        savePassword: true,
        handleFileChange: mockHandleFileChange,
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const fileInput = screen.getByLabelText(/Select PDF File/i);
      const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });

      await user.upload(fileInput, mockFile);

      expect(mockHandleFileChange).toHaveBeenCalled();
    });

    it('should display selected file name when file is selected', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: new File(['content'], 'test.pdf'),
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      expect(screen.getByText(/Selected: test.pdf/i)).toBeInTheDocument();
    });
  });

  describe('Password Input Interactions', () => {
    it('should call handlePasswordChange when password is entered', async () => {
      const user = userEvent.setup();
      const mockHandlePasswordChange = jest.fn();

      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: '',
        file: null,
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: mockHandlePasswordChange,
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const passwordInput = screen.getByLabelText(/PDF Password/i);
      await user.type(passwordInput, 'testpassword');

      expect(mockHandlePasswordChange).toHaveBeenCalled();
    });

    it('should trigger handleRemovePassword on Enter key press', async () => {
      const user = userEvent.setup();
      const mockHandleRemovePassword = jest.fn();

      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: mockHandleRemovePassword,
      });

      render(<App />);

      const passwordInput = screen.getByLabelText(/PDF Password/i);
      await user.type(passwordInput, '{Enter}');

      expect(mockHandleRemovePassword).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should disable button when file is not selected', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'password',
        isProcessing: false,
        error: '',
        fileName: '',
        file: null,
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const button = screen.getByRole('button', { name: /Remove Password & Download/i });
      expect(button).toBeDisabled();
    });

    it('should disable button when password is not entered', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const button = screen.getByRole('button', { name: /Remove Password & Download/i });
      expect(button).toBeDisabled();
    });

    it('should enable button when both file and password are provided', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const button = screen.getByRole('button', { name: /Remove Password & Download/i });
      expect(button).toBeEnabled();
    });

    it('should show processing text when isProcessing is true', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: true,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      expect(screen.getByRole('button', { name: /Processing.../i })).toBeInTheDocument();
    });

    it('should call handleRemovePassword when button is clicked', async () => {
      const user = userEvent.setup();
      const mockHandleRemovePassword = jest.fn();

      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: mockHandleRemovePassword,
      });

      render(<App />);

      const button = screen.getByRole('button', { name: /Remove Password & Download/i });
      await user.click(button);

      expect(mockHandleRemovePassword).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error is present', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: false,
        error: 'Invalid password',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });

    it('should not display error message when error is empty', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Save Password Feature', () => {
    it('should call handleSavePasswordChange when checkbox is toggled', async () => {
      const user = userEvent.setup();
      const mockHandleSavePasswordChange = jest.fn();

      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: '',
        file: null,
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: mockHandleSavePasswordChange,
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });
      await user.click(checkbox);

      expect(mockHandleSavePasswordChange).toHaveBeenCalled();
    });

    it('should show checked state when savePassword is true', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: '',
        isProcessing: false,
        error: '',
        fileName: '',
        file: null,
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe('Input Disabled States', () => {
    it('should disable all inputs when isProcessing is true', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: true,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const fileInput = screen.getByLabelText(/Select PDF File/i);
      const passwordInput = screen.getByLabelText(/PDF Password/i);
      const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });

      expect(fileInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(checkbox).toBeDisabled();
    });

    it('should enable all inputs when isProcessing is false', () => {
      mockUsePDFPasswordRemover.mockReturnValueOnce({
        password: 'test123',
        isProcessing: false,
        error: '',
        fileName: 'test.pdf',
        file: { name: 'test.pdf' },
        savePassword: true,
        handleFileChange: jest.fn(),
        handlePasswordChange: jest.fn(),
        handleSavePasswordChange: jest.fn(),
        handleRemovePassword: jest.fn(),
      });

      render(<App />);

      const fileInput = screen.getByLabelText(/Select PDF File/i);
      const passwordInput = screen.getByLabelText(/PDF Password/i);
      const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });

      expect(fileInput).toBeEnabled();
      expect(passwordInput).toBeEnabled();
      expect(checkbox).toBeEnabled();
    });
  });

  describe('Google Analytics', () => {
    it('should call createGoogleTag on component mount', () => {
      render(<App />);

      expect(mockCreateGoogleTag).toHaveBeenCalled();
    });
  });
});
