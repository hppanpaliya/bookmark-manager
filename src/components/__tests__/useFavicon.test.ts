import { renderHook, act } from '@testing-library/react';
import { useFavicon } from '../../lib/useFavicon';

describe('useFavicon', () => {
  let originalImage: typeof Image;

  beforeAll(() => {
    // Mock Image constructor
    originalImage = global.Image;
    global.Image = jest.fn().mockImplementation(() => ({
      onload: jest.fn(),
      onerror: jest.fn(),
      src: '',
      naturalWidth: 0,
      naturalHeight: 0,
    })) as jest.Mocked<typeof global.Image>;
  });

  afterAll(() => {
    global.Image = originalImage;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null faviconUrl and loading false for empty url', () => {
    const { result } = renderHook(() => useFavicon(''));

    expect(result.current.faviconUrl).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('loads favicon with fallback sizes', async () => {
    const mockImage = {
      onload: jest.fn(),
      onerror: jest.fn(),
      src: '',
      naturalWidth: 32,
      naturalHeight: 32,
    };

    (global.Image as jest.Mock).mockImplementation(() => mockImage);

    const { result } = renderHook(() => useFavicon('https://example.com'));

    // Should try the first size (256)
    expect(mockImage.src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=256');

    // Simulate successful load with sufficient size
    act(() => {
      mockImage.onload();
    });

    expect(result.current.faviconUrl).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=256');
    expect(result.current.loading).toBe(false);
  });

  it('falls back to smaller sizes when larger ones fail', async () => {
    const mockImage = {
      onload: jest.fn(),
      onerror: jest.fn(),
      src: '',
      naturalWidth: 16,
      naturalHeight: 16,
    };

    (global.Image as jest.Mock).mockImplementation(() => mockImage);

    const { result } = renderHook(() => useFavicon('https://example.com'));

    // Should try 256 first
    expect(mockImage.src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=256');

    // Simulate load but with insufficient size
    act(() => {
      mockImage.onload();
    });

    // Should try next size (128)
    expect(mockImage.src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');

    // Simulate load with sufficient size
    act(() => {
      mockImage.naturalWidth = 32;
      mockImage.naturalHeight = 32;
      mockImage.onload();
    });

    expect(result.current.faviconUrl).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');
    expect(result.current.loading).toBe(false);
  });

  it('returns null when all sizes fail', async () => {
    const mockImage = {
      onload: jest.fn(),
      onerror: jest.fn(),
      src: '',
      naturalWidth: 16,
      naturalHeight: 16,
    };

    (global.Image as jest.Mock).mockImplementation(() => mockImage);

    const { result } = renderHook(() => useFavicon('https://example.com'));

    // Go through all sizes
    const sizes = [256, 128, 64, 32, 16];
    for (let i = 0; i < sizes.length; i++) {
      expect(mockImage.src).toBe(`https://www.google.com/s2/favicons?domain=example.com&sz=${sizes[i]}`);

      act(() => {
        if (i === sizes.length - 1) {
          // Last attempt fails
          mockImage.onerror();
        } else {
          // Previous attempts have insufficient size
          mockImage.onload();
        }
      });
    }

    expect(result.current.faviconUrl).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles invalid URLs gracefully', () => {
    const { result } = renderHook(() => useFavicon('invalid-url'));

    expect(result.current.faviconUrl).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('updates when URL changes', () => {
    const { result, rerender } = renderHook(({ url }) => useFavicon(url), {
      initialProps: { url: 'https://example.com' },
    });

    expect(result.current.loading).toBe(true);

    rerender({ url: 'https://different.com' });

    // Should reset and start loading new favicon
    expect(result.current.loading).toBe(true);
  });
});