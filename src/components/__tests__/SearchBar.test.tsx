import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock UI components
jest.mock('../ui/Input', () => ({
  Input: ({ value, onChange, placeholder, type, className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
}));

jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('SearchBar', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Search bookmarks...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar value="" onChange={mockOnChange} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('displays initial value', () => {
    render(<SearchBar value="initial value" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('initial value')).toBeInTheDocument();
  });

  it('shows search icon', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('does not show clear button when input is empty', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
  });

  it('shows clear button when input has value', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);

    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('calls onChange after debounce delay', async () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Search bookmarks...');
    fireEvent.change(input, { target: { value: 'test search' } });

    // Should not call immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test search');
    });
  });

  it('clears input when clear button is clicked', () => {
    render(<SearchBar value="test value" onChange={mockOnChange} />);

    const clearButton = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(clearButton!);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('updates local value when props change', () => {
    const { rerender } = render(<SearchBar value="old value" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('old value')).toBeInTheDocument();

    rerender(<SearchBar value="new value" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('new value')).toBeInTheDocument();
  });

  it('debounces multiple rapid changes', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Search bookmarks...');

    fireEvent.change(input, { target: { value: 'first' } });
    jest.advanceTimersByTime(100);

    fireEvent.change(input, { target: { value: 'second' } });
    jest.advanceTimersByTime(100);

    fireEvent.change(input, { target: { value: 'third' } });
    jest.advanceTimersByTime(300);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('third');
  });

  it('handles empty string input', () => {
    render(<SearchBar value="initial" onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('initial');
    fireEvent.change(input, { target: { value: '' } });

    jest.advanceTimersByTime(300);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});