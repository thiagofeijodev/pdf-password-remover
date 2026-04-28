import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeicConverterForm from './HeicConverterForm';

jest.mock('../utils/rustHeicConverter', () => ({
  cancelHeicConversion: jest.fn(),
  heicToPng: jest.fn(),
  heicToPngUnderSize: jest.fn(),
  initWasm: jest.fn(),
}));

// Mock internal utilities/hooks used by the component
jest.mock('../hooks/useRustHeicConverter', () => ({
  useRustHeicConverter: () => ({
    processHeicWithRust: jest.fn(async () => new Blob(['png'], { type: 'image/png' })),
    isReady: true,
    isLoading: false,
    initError: null,
  }),
}));

jest.mock('../utils/createSafeBuffer', () => ({
  createSafeBuffer: jest.fn(async () => new ArrayBuffer(8)),
}));

jest.mock('../utils/downloadBlob', () => ({
  downloadBlob: jest.fn(),
}));

describe('HeicConverterForm', () => {
  it('allows selecting a HEIC file and triggers conversion flow', async () => {
    const user = userEvent.setup();

    const { createSafeBuffer } = require('../utils/createSafeBuffer');
    const { downloadBlob } = require('../utils/downloadBlob');
    const { ProcessingProvider } = require('../context/ProcessingProvider');

    render(
      <ProcessingProvider>
        <HeicConverterForm />
      </ProcessingProvider>,
    );

    const fileInput = screen.getByLabelText(/Select HEIC Image/i);
    const convertButton = screen.getByRole('button', { name: /Convert to PNG & Download/i });

    const mockFile = new File(['heic'], 'photo.heic', { type: 'image/heic' });
    await user.upload(fileInput, mockFile);

    expect(screen.getByText(/Selected: photo.heic/i)).toBeInTheDocument();

    // Click convert
    await user.click(convertButton);

    expect(createSafeBuffer).toHaveBeenCalled();
    expect(downloadBlob).toHaveBeenCalled();
  });
});
