import { Test, TestingModule } from '@nestjs/testing';
import { ManagedFilesController } from './managed-files.controller';
import { ManagedFilesService } from './managed-files.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ManagedFilesController', () => {
  let controller: ManagedFilesController;

  const prismaMock: any = {
    managedFile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagedFilesController],
      providers: [
        ManagedFilesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<ManagedFilesController>(ManagedFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
