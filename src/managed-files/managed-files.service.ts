import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { prefixToExtMime } from '../utils/utils';

// que voy a guardar aqui: imagenes, audios????, torrent files,
@Injectable()
export class ManagedFilesService implements OnModuleInit {
  s3: S3Client;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    console.log('init managed files'); // todo like prisma make it global? now is making 2 instances
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
  async createManagedFile(
    prefix: 'img' | 'wtt',
    file: Buffer,
    cache: boolean = false,
  ) {
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
      const meta = prefixToExtMime(exists.prefix);
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

      const meta = prefixToExtMime(prefix);
      filename = newRecordId.id + meta.ext;
      id = newRecordId.id;

      const command = {
        Bucket: 'dev-vcris', // todo load from .env
        Key: `${prefix}/${filename}`,
        Body: file,
        ContentType: meta.mime,
      };
      if (cache) {
        command['CacheControl'] = 'public, max-age=31536000, immutable';
      }

      const result = await this.s3.send(new PutObjectCommand(command));
      // check if upload successfull
      console.log(result);
      if (![200, 201].includes(result.$metadata.httpStatusCode ?? 0)) {
        // rollback creation of record (otherwise next attempt will go to dupe branch.
        const deleteResult = await this.prisma.managedFile.delete({
          where: {
            id: newRecordId.id,
          },
        });
        console.log('upload failed deleted record:');
        console.log(deleteResult);
        throw new HttpException('Torrent Upload Failed', 500);
      }
    }

    return {
      id: id,
      url: `https://dev-vcris.25127928.xyz/${prefix}/${filename}`, // todo base url from .env
    };
  }

  // GET un archivo / retorna datos necesarios para utilizar el archivo.
  getManagedFile(id: string) {}

  // borrar archivo / elimina referencia a este archivo de la fuente que decia.
  removeManagedFileReference() {}

  // sync / sincroniza archivos / borra los sin referencias / manda warnings de missing files.
  syncManagedFiles() {}
}
