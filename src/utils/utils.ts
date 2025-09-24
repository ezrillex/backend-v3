export function fileMetaToUrl(meta: { prefix: string; id: string }) {
  return `https://dev-vcris.25127928.xyz/${meta.prefix}/${meta.id}${prefixToExtMime(meta.prefix).ext}`;
}

export function fileMetaToUrlFallback(
  meta: { prefix: string; id: string } | null,
  fallback: string,
) {
  console.log(meta);
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
