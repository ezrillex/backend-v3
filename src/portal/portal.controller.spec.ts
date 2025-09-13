import { Test, TestingModule } from '@nestjs/testing';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

describe('PortalController', () => {
  let controller: PortalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortalController],
      providers: [PortalService],
    }).compile();

    controller = module.get<PortalController>(PortalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
