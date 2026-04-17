import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { prefixToExtMime } from '../utils/utils';
import { isUUID } from 'class-validator';
import { fileMetaToKey } from '../utils/utils';
import { Cron } from '@nestjs/schedule';

// que voy a guardar aqui: imagenes, audios????, torrent files,
@Injectable()
export class ManagedFilesService implements OnModuleInit {
  s3: S3Client;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    console.log('init managed files'); // todo like prisma make it global? now is making 2 instances
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://REDACTED_ACCOUNT_ID.r2.cloudflarestorage.com/`,
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
      url: `https://redacted.invalid/${prefix}/${filename}`, // todo base url from .env
    };
  }

  // GET un archivo / retorna datos necesarios para utilizar el archivo.
  getManagedFile(id: string) {}

  // sync / sincroniza archivos / borra los sin referencias / manda warnings de missing files.
  async syncManagedFiles() {
    // obtener lista de archivos en bucket
    const bucketObjects: any[] = [];
    let ContinuationToken: string | undefined;

    do {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: 'dev-vcris', // todo load this from .env,
          ContinuationToken: ContinuationToken,
          // MaxKeys: 2,
        }),
      );
      // todo check if res is ok 200.
      if (res.$metadata.httpStatusCode !== 200) {
        console.log('failed to get bucket files list. error:');
        console.log(res);
        return 'Finished';
      }

      bucketObjects.push(...(res.Contents || []));
      ContinuationToken = res.NextContinuationToken;
    } while (ContinuationToken);

    // validar que los archivos en la bucket existen en la base de datos
    if (bucketObjects.length === 0) {
      return 'Done: bucket length 0';
    }

    const omitKeys = ['img/default_avatar.webp'];
    // omitir archivos excepcionales / hard coded / sin registro en db ie. default avatar.
    for (let i = bucketObjects.length - 1; i >= 0; i--) {
      if (omitKeys.includes(bucketObjects[i].Key)) {
        bucketObjects.splice(i, 1);
      }
    }

    const ids: string[] = [];
    for (let i = 0; i < bucketObjects.length; i++) {
      bucketObjects[i]['id'] = keyToId(bucketObjects[i].Key);
      if (bucketObjects[i].id) {
        ids.push(bucketObjects[i].id);
      }
    }

    // buscar en base de datos los ids que estan en el bucket.
    const integrityCount = await this.prisma.managedFile.count({
      where: {
        id: {
          in: ids,
        },
      },
    });

    console.log('bucket count: ', bucketObjects.length);
    console.log('found files in db: ', integrityCount);
    if (bucketObjects.length === integrityCount) {
      return 'Done, files & integrity match';
    }

    // si no match integrity buscar los que no estan.

    // borrar archivos que no estan en la base de datos / or send notification so that I review this.
    // todo should this be manual to avoid data loss?
    return bucketObjects;
  }

  @Cron('0 2 * * *')
  async cleanupUnusedFiles() {
    // buscar archivos sin referencias
    const noRefsFilesObj = await this.prisma.managedFile.findMany({
      where: {
        thumbnails: { none: {} },
        torrents: { none: {} },
        avatars: { none: {} },
      },
      select: {
        id: true,
        prefix: true,
      },
    });
    console.log(
      new Date().toDateString(),
      '   |   Files to delete, cleanup unused files job:',
    );
    console.log(noRefsFilesObj);
    const noRefsFilesIds = noRefsFilesObj.map((file) => file.id);

    const noRefsFilesKeys = noRefsFilesObj.map((file) => {
      return {
        Key: fileMetaToKey(file),
      };
    });
    // borrar archivos sin referencias de los archivos y de la db.

    if (noRefsFilesIds.length > 0) {
      const deleteResult = await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: 'dev-vcris', // todo load this from .env
          Delete: {
            Quiet: false,
            Objects: noRefsFilesKeys,
          },
        }),
      );

      // check if delete was ok, then delete from db. if failed it will not remove our reference.
      if (deleteResult.$metadata.httpStatusCode === 200) {
        // delete record from db
        await this.prisma.managedFile.deleteMany({
          where: {
            id: {
              in: noRefsFilesIds,
            },
          },
        });
      }
    }
  }
}
// if the key does not match to a malformed id it returns undefined.
function keyToId(key: string): string | null {
  if (!(key.startsWith('img/') || key.startsWith('wtt/'))) {
    return null; // no valid prefix
  }
  if (!(key.endsWith('.webp') || key.endsWith('.torrent'))) {
    return null; // no valid file format
  }
  const filename = key.split('/')[1];
  const id = filename.split('.')[0];
  // validar uuid format.
  if (isUUID(id)) {
    return id;
  } else {
    return null;
  }
}
