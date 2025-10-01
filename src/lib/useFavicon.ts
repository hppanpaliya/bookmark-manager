import { useState, useEffect } from 'react';

const getFaviconUrl = (url: string, size: number) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return null;
  }
};

export const useFavicon = (url: string) => {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const sizes = [256, 128, 64, 32, 16];
    let currentIndex = 0;

    const tryNextSize = () => {
      if (currentIndex >= sizes.length) {
        setFaviconUrl(null);
        setLoading(false);
        return;
      }

      const size = sizes[currentIndex];
      const testUrl = getFaviconUrl(url, size);

      if (!testUrl) {
        setFaviconUrl(null);
        setLoading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Check if the image is actually larger than 16x16
        if (img.naturalWidth > 16 && img.naturalHeight > 16) {
          setFaviconUrl(testUrl);
          setLoading(false);
        } else {
          // Try next smaller size
          currentIndex++;
          tryNextSize();
        }
      };
      img.onerror = () => {
        // Try next smaller size
        currentIndex++;
        tryNextSize();
      };
      img.src = testUrl;
    };

    tryNextSize();
  }, [url]);

  return { faviconUrl, loading };
};