import { fileMetaToUrl, fileMetaToUrlFallback, prefixToExtMime } from './utils';

describe('utils', () => {
  describe('fileMetaToUrl', () => {
    it('should construct url with webp extension for img prefix', () => {
      const meta = { prefix: 'img', id: '123' };
      const url = fileMetaToUrl(meta);
      expect(url).toBe('https://dev-vcris.25127928.xyz/img/123.webp');
    });

    it('should construct url with .torrent extension for wtt prefix', () => {
      const meta = { prefix: 'wtt', id: 'abc' };
      const url = fileMetaToUrl(meta);
      expect(url).toBe('https://dev-vcris.25127928.xyz/wtt/abc.torrent');
    });

    it('should use .txt extension for unrecognized prefix', () => {
      const meta = { prefix: 'unknown', id: 'xyz' } as any;
      const url = fileMetaToUrl(meta);
      expect(url).toBe('https://dev-vcris.25127928.xyz/unknown/xyz.txt');
    });
  });

  describe('fileMetaToUrlFallback', () => {
    it('should return fallback when meta is null', () => {
      const fallback = 'https://example.com/fallback.png';
      const url = fileMetaToUrlFallback(null, fallback);
      expect(url).toBe(fallback);
    });

    it('should delegate to fileMetaToUrl when meta provided', () => {
      const meta = { prefix: 'img', id: '777' };
      const fallback = 'https://example.com/fallback.png';
      const url = fileMetaToUrlFallback(meta, fallback);
      expect(url).toBe('https://dev-vcris.25127928.xyz/img/777.webp');
    });
  });

  describe('prefixToExtMime', () => {
    it('should return webp mapping for img prefix', () => {
      const res = prefixToExtMime('img');
      expect(res).toEqual({ ext: '.webp', mime: 'image/webp' });
    });

    it('should return torrent mapping for wtt prefix', () => {
      const res = prefixToExtMime('wtt');
      expect(res).toEqual({
        ext: '.torrent',
        mime: 'application/x-bittorrent',
      });
    });

    it('should return text/plain mapping for unknown prefix', () => {
      const res = prefixToExtMime('zzz');
      expect(res).toEqual({ ext: '.txt', mime: 'text/plain' });
    });
  });
});
