import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { S3Service, UploadResult } from '../s3/s3.service';

@Injectable()
export class AssetsService {
  private readonly bucketName: string;

  constructor(private readonly s3Service: S3Service) {
    this.bucketName =
      process.env.EVENT_IMAGES_BUCKET || process.env.UPLOADS_BUCKET;

    if (!this.bucketName) {
      throw new Error(
        'Assets bucket not configured. Please set EVENT_IMAGES_BUCKET or UPLOADS_BUCKET environment variable.',
      );
    }
  }

  /**
   * Upload an event banner image
   * @param file Uploaded file
   * @returns Upload result with URL
   */
  async uploadEventBanner(file: Express.Multer.File): Promise<UploadResult> {
    return await this.s3Service.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: 'event-banners',
      contentType: file.mimetype,
      bucketName: this.bucketName,
    });
  }

  /**
   * Upload a generic asset file
   * @param file Uploaded file
   * @param folder Optional folder path
   * @returns Upload result with URL
   */
  async uploadAsset(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    return await this.s3Service.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: folder || 'assets',
      contentType: file.mimetype,
      bucketName: this.bucketName,
    });
  }

  /**
   * Delete an asset by key
   * @param key File key in the bucket
   */
  async deleteAsset(key: string): Promise<void> {
    return await this.s3Service.deleteFile(key, this.bucketName);
  }

  /**
   * Get a signed URL for temporary access to an asset
   * @param key File key in the bucket
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return await this.s3Service.getSignedUrl(key, this.bucketName, expiresIn);
  }
}
