import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarkForm } from '../BookmarkForm';
import { Bookmark, Category } from '@/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

// Mock UI components
jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../ui/Input', () => ({
  Input: ({ value, onChange, id, type, className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      id={id}
      type={type || 'text'}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
}));

jest.mock('../ui/Textarea', () => ({
  Textarea: ({ value, onChange, id, rows, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      {...props}
    />
  ),
}));

describe('BookmarkForm', () => {
  const mockCategories: Category[] = [
    { id: 1, name: 'Work', color: '#ff0000', emoji: '💼', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, name: 'Personal', color: '#00ff00', emoji: '🏠', created_at: '2024-01-01T00:00:00Z' },
  ];

  const mockBookmark: Bookmark = {
    id: 1,
    title: 'Test Bookmark',
    url: 'https://example.com',
    description: 'A test bookmark',
    username: 'testuser',
    password: 'testpass',
    category_id: 1,
    is_private: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: mockCategories[0],
  };

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
  it('renders form with empty fields', () => {
    render(
      <BookmarkForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('heading', { name: 'Add Bookmark' })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/url/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/username/i)).toHaveValue('');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
    expect(screen.getByLabelText(/keep this bookmark private/i)).not.toBeChecked();
  });    it('renders category select with options', () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('No Category')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add bookmark/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Title is required')).toBeInTheDocument();
      expect(await screen.findByText('URL is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const urlInput = screen.getByLabelText(/url/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const categorySelect = screen.getByRole('combobox');
      const privateCheckbox = screen.getByLabelText(/keep this bookmark private/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.change(categorySelect, { target: { value: '1' } });
      fireEvent.click(privateCheckbox);

      const submitButton = screen.getByRole('button', { name: /add bookmark/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Title',
          url: 'https://example.com',
          description: 'Test description',
          username: 'testuser',
          password: 'testpass',
          category_id: 1,
          is_private: true,
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders form with pre-filled values', () => {
      render(
        <BookmarkForm
          bookmark={mockBookmark}
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Bookmark')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toHaveValue('Test Bookmark');
      expect(screen.getByLabelText(/url/i)).toHaveValue('https://example.com');
      expect(screen.getByLabelText(/description/i)).toHaveValue('A test bookmark');
      expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
      expect(screen.getByLabelText(/password/i)).toHaveValue('testpass');
      expect(screen.getByRole('combobox')).toHaveValue('1');
      expect(screen.getByLabelText(/keep this bookmark private/i)).toBeChecked();
    });

    it('submits updated data', async () => {
      render(
        <BookmarkForm
          bookmark={mockBookmark}
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      const submitButton = screen.getByRole('button', { name: /update bookmark/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Updated Title',
          url: 'https://example.com',
          description: 'A test bookmark',
          username: 'testuser',
          password: 'testpass',
          category_id: 1,
          is_private: true,
        });
      });
    });
  });

  describe('Password Visibility', () => {
    it('toggles password visibility', () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByTestId('eye-icon');

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when X button is clicked', () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const xButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(xButton!);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('disables submit button when loading', () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('handles empty optional fields correctly', async () => {
      render(
        <BookmarkForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const urlInput = screen.getByLabelText(/url/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

      const submitButton = screen.getByRole('button', { name: /add bookmark/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Title',
          url: 'https://example.com',
          description: undefined,
          username: undefined,
          password: undefined,
          category_id: undefined,
          is_private: false,
        });
      });
    });
  });
});