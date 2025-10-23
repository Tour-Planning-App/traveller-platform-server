import { Module } from '@nestjs/common';
import { ToolsServiceController } from './tools-service.controller';

@Module({
  controllers: [ToolsServiceController],
})
export class ToolsServiceModule {}
