import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PDFRemoverForm from './PDFRemoverForm';

// Mock the hook used inside the component
jest.mock('../hooks/usePDFPasswordRemover', () => ({
  usePDFPasswordRemover: jest.fn(),
}));

const mockUsePDFPasswordRemover = require('../hooks/usePDFPasswordRemover').usePDFPasswordRemover;

describe('PDFRemoverForm', () => {
  it('renders inputs and calls handlers', async () => {
    const user = userEvent.setup();
    const mockHandleFileChange = jest.fn();
    const mockHandlePasswordChange = jest.fn();
    const mockHandleSavePasswordChange = jest.fn();
    const mockHandleRemovePassword = jest.fn();

    // Provide the hook return value (handlers and state)
    mockUsePDFPasswordRemover.mockReturnValue({
      file: { name: 'test.pdf' },
      fileName: 'test.pdf',
      password: 'abc',
      savePassword: true,
      isProcessing: false,
      error: '',
      handleFileChange: mockHandleFileChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleSavePasswordChange: mockHandleSavePasswordChange,
      handleRemovePassword: mockHandleRemovePassword,
    });

    render(<PDFRemoverForm />);

    const fileInput = screen.getByLabelText(/Select PDF File/i);
    const passwordInput = screen.getByLabelText(/PDF Password/i);
    const checkbox = screen.getByRole('checkbox', { name: /Save password for next time/i });
    const button = screen.getByRole('button', { name: /Remove Password & Download/i });

    // Upload file should call handler
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    // Some user-event/upload variations don't trigger the handler reliably in this env
    // Use fireEvent.change to ensure the input change event fires with files
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    expect(mockHandleFileChange).toHaveBeenCalled();

    // Typing should call password change
    await user.type(passwordInput, 'abc');
    expect(mockHandlePasswordChange).toHaveBeenCalled();

    // Toggle checkbox
    await user.click(checkbox);
    expect(mockHandleSavePasswordChange).toHaveBeenCalled();

    // Click button
    await user.click(button);
    expect(mockHandleRemovePassword).toHaveBeenCalled();
  });
});
