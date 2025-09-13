import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  updateChannel(id: string, newName: string) {
    return this.prisma.channels.update({
      where: {
        id: id,
      },
      data: {
        name: newName,
      },
    });
  }
}
