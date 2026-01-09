import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadFileOptions {
  buffer: Buffer;
  fileName: string;
  folder?: string;
  contentType?: string;
  bucketName: string;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly region: string;
  private readonly endpoint: string;

  constructor() {
    this.region = process.env.SB_S3_REGION;
    this.endpoint = process.env.SB_S3_ENDPOINT;

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.SB_S3_ACCESS_KEY,
        secretAccessKey: process.env.SB_S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    this.logger.log('S3 Service initialized');
  }

  /**
   * Upload a file to S3
   * @param options - Upload options including buffer, fileName, folder, contentType, and bucketName
   * @returns Upload result with key, url, and bucket
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { buffer, fileName, folder, contentType, bucketName } = options;

    if (!bucketName) {
      throw new Error('Bucket name must be provided in options');
    }

    // Generate the S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/\s+/g, '-');
    const key = folder
      ? `${folder}/${timestamp}-${sanitizedFileName}`
      : `${timestamp}-${sanitizedFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      });

      await this.s3Client.send(command);

      const url = `${this.endpoint}/${bucketName}/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        bucket: bucketName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param key - The S3 object key to delete
   * @param bucketName - Bucket name (required)
   */
  async deleteFile(key: string, bucketName: string): Promise<void> {
    if (!bucketName) {
      throw new Error('Bucket name must be provided');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for temporary access to a file
   * @param key - The S3 object key
   * @param bucketName - Bucket name (required)
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Pre-signed URL
   */
  async getSignedUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!bucketName) {
      throw new Error('Bucket name must be provided');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.log(`Generated signed URL for: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
