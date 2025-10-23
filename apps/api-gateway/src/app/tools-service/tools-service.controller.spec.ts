import { Test, TestingModule } from '@nestjs/testing';
import { ToolsServiceController } from './tools-service.controller';

describe('ToolsServiceController', () => {
  let controller: ToolsServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsServiceController],
    }).compile();

    controller = module.get<ToolsServiceController>(ToolsServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
