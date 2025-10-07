import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fileMetaToUrlFallback } from '../utils/utils';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}
  async getChannelById(id: string) {
    // info to show: posts separated by tabs?
    // todo include channel avatar url. and stats of channel?
    const data = await this.prisma.channels.findUniqueOrThrow({
      where: { id },
      include: { avatarFile: true },
    });
    console.log(data);
    return {
      id: data.id,
      name: data.name,
      avatar: fileMetaToUrlFallback(
        data.avatarFile,
        'https://redacted.invalid/img/default_avatar.webp', // todo use .env for this value
      ),
    };
  }
}
