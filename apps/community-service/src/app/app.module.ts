import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommunityModule } from './community/community.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [CommunityModule,
        MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb+srv://backend:qOcyo4PRHs9qGuy0@cluster0.19todyv.mongodb.net/travel-app?retryWrites=true&w=majority')
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
