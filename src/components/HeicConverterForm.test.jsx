import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeicConverterForm from './HeicConverterForm';

// Mock internal utilities/hooks used by the component
jest.mock('../hooks/useRustHeicConverter', () => ({
  useRustHeicConverter: () => ({
    processHeicWithRust: jest.fn(async () => new Blob(['png'], { type: 'image/png' })),
    isReady: true,
    isLoading: false,
  }),
}));

jest.mock('../utils/createPDFBuffer', () => ({
  createPDFBuffer: jest.fn(async () => new ArrayBuffer(8)),
}));

jest.mock('../utils/downloadBlob', () => ({
  downloadBlob: jest.fn(),
}));

describe('HeicConverterForm', () => {
  it('allows selecting a HEIC file and triggers conversion flow', async () => {
    const user = userEvent.setup();

    const { createPDFBuffer } = require('../utils/createPDFBuffer');
    const { downloadBlob } = require('../utils/downloadBlob');

    render(<HeicConverterForm />);

    const fileInput = screen.getByLabelText(/Select HEIC Image/i);
    const convertButton = screen.getByRole('button', { name: /Convert to PNG & Download/i });

    const mockFile = new File(['heic'], 'photo.heic', { type: 'image/heic' });
    await user.upload(fileInput, mockFile);

    expect(screen.getByText(/Selected: photo.heic/i)).toBeInTheDocument();

    // Click convert
    await user.click(convertButton);

    expect(createPDFBuffer).toHaveBeenCalled();
    expect(downloadBlob).toHaveBeenCalled();
  });
});
