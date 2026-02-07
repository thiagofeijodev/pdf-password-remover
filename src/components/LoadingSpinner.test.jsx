import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingSpinner from './LoadingSpinner';
import { ProcessingProvider, useProcessing } from '../context/ProcessingContext';

describe('LoadingSpinner', () => {
  const TestComponent = ({ onMount }) => {
    const { setIsPDFProcessing } = useProcessing();
    React.useEffect(() => {
      onMount?.(setIsPDFProcessing);
    }, [setIsPDFProcessing, onMount]);

    return (
      <div>
        <button onClick={() => setIsPDFProcessing(true)}>Start</button>
        <LoadingSpinner />
      </div>
    );
  };

  const renderWithProvider = (component) => {
    return render(<ProcessingProvider>{component}</ProcessingProvider>);
  };

  it('should not render when isProcessing is false', () => {
    renderWithProvider(<LoadingSpinner />);
    const overlay = screen.queryByRole('status');
    expect(overlay).not.toBeInTheDocument();
  });

  it('should render spinner overlay when isProcessing is true', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TestComponent />);

    // Initially spinner should not be visible
    let statusRole = screen.queryByRole('status');
    expect(statusRole).not.toBeInTheDocument();

    // Click to start processing
    const button = screen.getByRole('button', { name: /start/i });
    await user.click(button);

    // Now spinner should be visible
    statusRole = screen.queryByRole('status');
    expect(statusRole).toBeInTheDocument();
    expect(statusRole).toHaveAttribute('aria-label', 'Processing, please wait');
  });

  it('should have correct accessibility attributes', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TestComponent />);

    const button = screen.getByRole('button');
    await user.click(button);

    const statusDiv = screen.getByRole('status');
    expect(statusDiv).toHaveAttribute('aria-label', 'Processing, please wait');

    const spinner = statusDiv.querySelector('div:last-child');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});
