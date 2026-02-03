import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface UploadFileOptions {
  buffer: Buffer;
  fileName: string;
  folder?: string;
  contentType: string;
  bucketName: string;
}

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor() {
    const region = process.env.AWS_S3_REGION;
    const endpoint = process.env.AWS_S3_ENDPOINT;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_S3_SECRET_KEY;

    if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required S3 configuration. Please set AWS_S3_REGION, AWS_S3_ENDPOINT, AWS_S3_ACCESS_KEY, and AWS_S3_SECRET_KEY environment variables.',
      );
    }

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible storage like Supabase
    });
  }

  /**
   * Upload a file to S3-compatible storage
   * @param options Upload configuration options
   * @returns Upload result with URL and key
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { buffer, fileName, folder = '', contentType, bucketName } = options;

    if (!bucketName) {
      throw new HttpException(
        'Bucket name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop();
    const key = folder
      ? `${folder}/${timestamp}-${randomString}.${fileExtension}`
      : `${timestamp}-${randomString}.${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      // Construct the public URL
      // For Supabase Storage: https://project-ref.supabase.co/storage/v1/object/public/bucket/key
      // For AWS S3: https://bucket.s3.region.amazonaws.com/key
      const endpoint = process.env.AWS_S3_ENDPOINT || '';
      const publicUrl = endpoint.includes('supabase')
        ? `${endpoint.replace('/s3', '')}/object/public/${bucketName}/${key}`
        : `${endpoint}/${bucketName}/${key}`;

      return {
        url: publicUrl,
        key,
        bucket: bucketName,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to upload file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a file from S3-compatible storage
   * @param key File key/path in the bucket
   * @param bucketName Name of the bucket
   */
  async deleteFile(key: string, bucketName: string): Promise<void> {
    if (!bucketName) {
      throw new HttpException(
        'Bucket name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new HttpException(
        `Failed to delete file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate a signed URL for temporary file access
   * @param key File key/path in the bucket
   * @param bucketName Name of the bucket
   * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!bucketName) {
      throw new HttpException(
        'Bucket name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      throw new HttpException(
        `Failed to generate signed URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
