import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkCard } from '../BookmarkCard';
import { Bookmark } from '@/types';

// Mock the useFavicon hook
jest.mock('@/lib/useFavicon', () => ({
  useFavicon: jest.fn(),
}));

// Mock the utils functions
jest.mock('@/lib/utils', () => ({
  formatDate: jest.fn(),
  getDomainFromUrl: jest.fn(),
  cn: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  User: () => <div data-testid="user-icon" />,
  Key: () => <div data-testid="key-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

// Mock Button component
jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import { useFavicon } from '@/lib/useFavicon';
import { formatDate, getDomainFromUrl, cn } from '@/lib/utils';

const mockUseFavicon = useFavicon as jest.MockedFunction<typeof useFavicon>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockGetDomainFromUrl = getDomainFromUrl as jest.MockedFunction<typeof getDomainFromUrl>;
const mockCn = cn as jest.MockedFunction<typeof cn>;

describe('BookmarkCard', () => {
  const mockBookmark: Bookmark = {
    id: 1,
    title: 'Test Bookmark',
    url: 'https://example.com',
    description: 'A test bookmark description',
    username: 'testuser',
    password: 'testpass',
    category_id: 1,
    is_private: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: {
      id: 1,
      name: 'Test Category',
      color: '#ff0000',
      emoji: '📚',
      created_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    mockUseFavicon.mockReturnValue({
      faviconUrl: 'https://example.com/favicon.ico',
      loading: false,
    });
    mockFormatDate.mockReturnValue('Jan 1, 2024');
    mockGetDomainFromUrl.mockReturnValue('example.com');
    mockCn.mockImplementation((...args) => args.join(' '));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders bookmark title and description', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    expect(screen.getByText('Test Bookmark')).toBeInTheDocument();
    expect(screen.getByText('A test bookmark description')).toBeInTheDocument();
  });

  it('renders favicon when available', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    const favicon = screen.getByAltText('');
    expect(favicon).toBeInTheDocument();
    expect(favicon).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('renders domain and formatted date', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    expect(mockGetDomainFromUrl).toHaveBeenCalledWith('https://example.com');
    expect(mockFormatDate).toHaveBeenCalledWith('2024-01-01T00:00:00Z');
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });

  it('renders category with emoji and color', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    const categoryBadge = screen.getByText('Test Category');
    expect(categoryBadge).toBeInTheDocument();
    expect(categoryBadge).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('renders lock icon for private bookmarks', () => {
    const privateBookmark = { ...mockBookmark, is_private: true };
    render(<BookmarkCard bookmark={privateBookmark} />);

    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('renders visit link with correct attributes', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    const visitLink = screen.getByRole('link', { name: /visit/i });
    expect(visitLink).toHaveAttribute('href', 'https://example.com');
    expect(visitLink).toHaveAttribute('target', '_blank');
    expect(visitLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render admin controls when not admin', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);

    expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
  });

  it('renders admin controls when isAdmin is true', () => {
    render(<BookmarkCard bookmark={mockBookmark} isAdmin={true} />);

    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('renders username and password fields for admin', () => {
    render(<BookmarkCard bookmark={mockBookmark} isAdmin={true} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('••••••••')).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<BookmarkCard bookmark={mockBookmark} isAdmin={true} />);

    const eyeIcon = screen.getByTestId('eye-icon');
    expect(screen.getByText('••••••••')).toBeInTheDocument();

    fireEvent.click(eyeIcon);
    expect(screen.getByText('testpass')).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<BookmarkCard bookmark={mockBookmark} isAdmin={true} onEdit={mockOnEdit} />);

    const editButton = screen.getByTestId('edit-icon').closest('button');
    fireEvent.click(editButton!);

    expect(mockOnEdit).toHaveBeenCalledWith(mockBookmark);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(<BookmarkCard bookmark={mockBookmark} isAdmin={true} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByTestId('trash-icon').closest('button');
    fireEvent.click(deleteButton!);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('handles missing description gracefully', () => {
    const bookmarkWithoutDesc = { ...mockBookmark, description: undefined };
    render(<BookmarkCard bookmark={bookmarkWithoutDesc} />);

    expect(screen.queryByText('A test bookmark description')).not.toBeInTheDocument();
  });

  it('handles missing category gracefully', () => {
    const bookmarkWithoutCategory = { ...mockBookmark, category: undefined };
    render(<BookmarkCard bookmark={bookmarkWithoutCategory} />);

    expect(screen.queryByText('📚Test Category')).not.toBeInTheDocument();
  });

  it('handles missing favicon gracefully', () => {
    mockUseFavicon.mockReturnValue({
      faviconUrl: null,
      loading: false,
    });

    render(<BookmarkCard bookmark={mockBookmark} />);

    expect(screen.queryByAltText('')).not.toBeInTheDocument();
  });

  it('handles favicon loading state', () => {
    mockUseFavicon.mockReturnValue({
      faviconUrl: 'https://example.com/favicon.ico',
      loading: true,
    });

    render(<BookmarkCard bookmark={mockBookmark} />);

    expect(screen.queryByAltText('')).not.toBeInTheDocument();
  });
});