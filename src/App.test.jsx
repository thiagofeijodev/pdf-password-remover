import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { usePDFPasswordRemover } from './hooks/usePDFPasswordRemover';
import { createGoogleTag } from './utils/createGoogleTag';

// Mock dependencies
jest.mock('./hooks/usePDFPasswordRemover');
jest.mock('./utils/createGoogleTag');

// Mock pdfjs-dist to avoid ESM issues
jest.mock('pdfjs-dist', () => ({
  __esModule: true,
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '4.9.169',
  getDocument: jest.fn(),
  PasswordResponses: {
    NEED_PASSWORD: 1,
    INCORRECT_PASSWORD: 2,
  },
}));

// Mock jspdf
jest.mock('jspdf', () => {
  const mockJsPDF = jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    addPage: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob(['pdf content'], { type: 'application/pdf' })),
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(595),
      },
    },
  }));
  return {
    __esModule: true,
    default: mockJsPDF,
  };
});

describe('App', () => {
  const mockHandleFileChange = jest.fn();
  const mockHandlePasswordChange = jest.fn();
  const mockHandleRemovePassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    usePDFPasswordRemover.mockReturnValue({
      password: '',
      isProcessing: false,
      error: '',
      fileName: '',
      file: null,
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });
  });

  it('renders the app with title and subtitle', () => {
    render(<App />);

    expect(screen.getByText('PDF Password Remover')).toBeInTheDocument();
    expect(
      screen.getByText('Upload a password-protected PDF and remove its password protection'),
    ).toBeInTheDocument();
  });

  it('calls createGoogleTag on mount', () => {
    render(<App />);

    expect(createGoogleTag).toHaveBeenCalledTimes(1);
  });

  it('renders file input with correct attributes', () => {
    render(<App />);

    const fileInput = screen.getByLabelText('Select PDF File');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.pdf,application/pdf');
    expect(fileInput).toBeEnabled();
  });

  it('renders password input with correct attributes', () => {
    render(<App />);

    const passwordInput = screen.getByLabelText('PDF Password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('placeholder', 'Enter the PDF password');
    expect(passwordInput).toBeEnabled();
  });

  it('calls handleFileChange when file is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    const fileInput = screen.getByLabelText('Select PDF File');
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    expect(mockHandleFileChange).toHaveBeenCalledTimes(1);
  });

  it('calls handlePasswordChange when password is entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    const passwordInput = screen.getByLabelText('PDF Password');
    await user.type(passwordInput, 'test123');

    expect(mockHandlePasswordChange).toHaveBeenCalledTimes(7); // Called for each character
  });

  it('displays file name when file is selected', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: '',
      isProcessing: false,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    expect(screen.getByText('Selected: test.pdf')).toBeInTheDocument();
  });

  it('does not display file name when no file is selected', () => {
    render(<App />);

    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: '',
      isProcessing: false,
      error: 'Test error message',
      fileName: '',
      file: null,
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('does not display error message when no error', () => {
    render(<App />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders button with correct initial text', () => {
    render(<App />);

    const button = screen.getByRole('button', { name: 'Remove Password & Download' });
    expect(button).toBeInTheDocument();
  });

  it('disables button when processing', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: true,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Processing...');
  });

  it('disables file and password inputs when processing', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: true,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const fileInput = screen.getByLabelText('Select PDF File');
    const passwordInput = screen.getByLabelText('PDF Password');

    expect(fileInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('disables button when no file is selected', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: false,
      error: '',
      fileName: '',
      file: null,
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when no password is entered', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: '',
      isProcessing: false,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('enables button when both file and password are provided', () => {
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: false,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
  });

  it('calls handleRemovePassword when button is clicked', async () => {
    const user = userEvent.setup();
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: false,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockHandleRemovePassword).toHaveBeenCalledTimes(1);
  });

  it('calls handleRemovePassword when Enter key is pressed in password input', async () => {
    const user = userEvent.setup();
    usePDFPasswordRemover.mockReturnValue({
      password: 'test123',
      isProcessing: false,
      error: '',
      fileName: 'test.pdf',
      file: { name: 'test.pdf' },
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<App />);

    const passwordInput = screen.getByLabelText('PDF Password');
    await user.type(passwordInput, '{Enter}');

    expect(mockHandleRemovePassword).toHaveBeenCalledTimes(1);
  });

  it('renders info section with privacy messages', () => {
    render(<App />);

    expect(screen.getByText('🔒 All processing is done in your browser')).toBeInTheDocument();
    expect(screen.getByText('📁 Your files never leave your device')).toBeInTheDocument();
  });
});
