import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

// que voy a guardar aqui: imagenes, audios????, torrent files,
@Injectable()
export class ManagedFilesService implements OnModuleInit {
  s3: S3Client;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://e900048a598474bb393692400fe1db73.r2.cloudflarestorage.com/`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_ID_KEY!, // TODO process env vars validation w/joi
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
      },
    });
  }

  // crear archivo / upload api, crear registros db api. RETORNA id y medios urls
  async createManagedFile(prefix: 'img' | 'wtt', file: Buffer) {
    // get file hash.
    const hash = crypto.createHash('sha256').update(file).digest('hex'); // Hexadecimal

    // check if is duplicate
    const exists = await this.prisma.managedFile.findUnique({
      where: {
        hash: hash,
      },
      select: {
        id: true,
        prefix: true,
      },
    });

    let filename: string;
    let id: string;
    if (exists !== null) {
      // branch if duplicated
      const meta = this.prefixToExtMime(exists.prefix);
      filename = exists.id + meta.ext;
      id = exists.id;
    } else {
      // branch if new file
      const newRecordId = await this.prisma.managedFile.create({
        select: {
          id: true,
        },
        data: {
          hash: hash,
          prefix: prefix,
        },
      });

      const meta = this.prefixToExtMime(prefix);
      filename = newRecordId.id + meta.ext;
      id = newRecordId.id;

      const result = await this.s3.send(
        new PutObjectCommand({
          Bucket: 'dev-vcris', // todo load from .env
          Key: `${prefix}/${filename}`,
          Body: file,
          ContentType: meta.mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      // check if upload successfull

      if (result.$metadata.httpStatusCode !== 200) {
        // todo error handling. xd
      }
    }

    return {
      id: id,
      url: `https://dev-vcris.25127928.xyz/${prefix}/${filename}`, // todo base url from .env
    };
  }

  prefixToExtMime(prefix: string) {
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

  // GET un archivo / retorna datos necesarios para utilizar el archivo.
  getManagedFile(id: string) {}

  // borrar archivo / elimina referencia a este archivo de la fuente que decia.
  removeManagedFileReference() {}

  // sync / sincroniza archivos / borra los sin referencias / manda warnings de missing files.
  syncManagedFiles() {}
}
