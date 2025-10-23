import { Test, TestingModule } from '@nestjs/testing';
import { ToolsServiceService } from './tools-service.service';

describe('ToolsServiceService', () => {
  let service: ToolsServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToolsServiceService],
    }).compile();

    service = module.get<ToolsServiceService>(ToolsServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
