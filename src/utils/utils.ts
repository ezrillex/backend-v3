export function fileMetaToUrl(meta: { prefix: string; id: string }) {
  return `https://redacted.invalid/${meta.prefix}/${meta.id}${prefixToExtMime(meta.prefix).ext}`;
}

export function fileMetaToUrlFallback(
  meta: { prefix: string; id: string } | null,
  fallback: string,
) {
  if (meta) {
    return fileMetaToUrl(meta);
  } else {
    return fallback;
  }
}

export function prefixToExtMime(prefix: string) {
  if (prefix === 'img') {
    return {
      ext: '.webp',
      mime: 'image/webp',
    };
  } else if (prefix === 'wtt') {
    return {
      ext: '.torrent',
      mime: 'application/x-bittorrent',
    };
  } else {
    return {
      ext: '.txt',
      mime: 'text/plain',
    };
  }
}
