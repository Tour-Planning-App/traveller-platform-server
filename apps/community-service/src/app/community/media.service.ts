// media.service.ts (in microservice - unchanged, but now used in gRPC)
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;
  private readonly endpoint: string;
  private readonly region: string;

  constructor() {
    this.region = 'us-west-000';
    this.endpoint = process.env.B2_ENDPOINT || 'https://s3.us-west-000.backblazeb2.com';
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID || '',
        secretAccessKey: process.env.B2_APPLICATION_KEY || '',
      },
      forcePathStyle: false,
    });
  }

  async uploadFile(buffer: Buffer, fileName: string, contentType: string, bucketName: string = process.env.B2_BUCKET_NAME || ''): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('No file data provided');
    }

    const fileExtension = extname(fileName);
    const key = `community-media/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    } as any;

    try {
      await this.s3Client.send(new PutObjectCommand(params));
      const url = `https://f005.backblazeb2.com/file/${bucketName}/${key}`;
      this.logger.log(`File uploaded: ${url}`);
      return url;
    } catch (error: any) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException('File upload failed');
    }
  }

  async uploadProfileImage(buffer: Buffer, fileName: string, contentType: string, bucketName: string = process.env.B2_BUCKET_NAME || ''): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('No file data provided');
    }

    const fileExtension = extname(fileName);
    const key = `community-profile/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    } as any;

    try {
      await this.s3Client.send(new PutObjectCommand(params));
      const url = `https://f005.backblazeb2.com/file/${bucketName}/${key}`;
      this.logger.log(`File uploaded: ${url}`);
      return url;
    } catch (error: any) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException('File upload failed');
    }
  }

}