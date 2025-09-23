import { Test, TestingModule } from '@nestjs/testing';
import { ManagedFilesController } from './managed-files.controller';
import { ManagedFilesService } from './managed-files.service';

describe('ManagedFilesController', () => {
  let controller: ManagedFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagedFilesController],
      providers: [ManagedFilesService],
    }).compile();

    controller = module.get<ManagedFilesController>(ManagedFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
