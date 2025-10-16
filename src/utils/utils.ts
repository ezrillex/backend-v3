import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';

// todo laod from .env but note this is pure consider if needs to be on service or accept a base url from param?
// gpt mentions that this file is ok only if no service dependencies / logger /config service.
// todo should this file related utils be on managed file service?
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

export async function validateImage(
  base64: string,
  width: number,
  height: number,
) {
  let meta: sharp.Metadata;
  let imageBuffer: Buffer;

  try {
    imageBuffer = Buffer.from(base64, 'base64');
    meta = await sharp(imageBuffer).metadata();
  } catch {
    throw new BadRequestException('Invalid image data');
  }

  if (meta.format !== 'webp') {
    throw new BadRequestException('Invalid image format.');
  }
  if (meta.hasAlpha) {
    throw new BadRequestException('Transparency not allowed');
  }
  if (meta.width !== width || meta.height !== height) {
    throw new BadRequestException('Image dimensions must be 1280x720');
  }
  return imageBuffer;
}
