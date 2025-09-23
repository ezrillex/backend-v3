import { Test, TestingModule } from '@nestjs/testing';
import { ManagedFilesService } from './managed-files.service';

describe('ManagedFilesService', () => {
  let service: ManagedFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManagedFilesService],
    }).compile();

    service = module.get<ManagedFilesService>(ManagedFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
