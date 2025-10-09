import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItinerariesModule } from './itineraries/itineraries.module';

@Module({
  imports: [ItinerariesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
