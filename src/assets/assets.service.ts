import { Injectable } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { S3Service, UploadResult } from '../s3/s3.service';

@Injectable()
export class AssetsService {
  private readonly bucketName: string;

  constructor(private readonly s3Service: S3Service) {
    // Define your bucket name here
    this.bucketName = process.env.AWS_ASSETS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  }

  async uploadEventBanner(file: Express.Multer.File): Promise<UploadResult> {
    return await this.s3Service.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: 'event-banners',
      contentType: file.mimetype,
      bucketName: this.bucketName,
    });
  }

  async uploadTicketCategoryThumbnail(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    return await this.s3Service.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: 'ticket-category-thumbnails',
      contentType: file.mimetype,
      bucketName: this.bucketName,
    });
  }

  create(createAssetDto: CreateAssetDto) {
    return 'This action adds a new asset';
  }

  findAll() {
    return `This action returns all assets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} asset`;
  }

  update(id: number, updateAssetDto: UpdateAssetDto) {
    return `This action updates a #${id} asset`;
  }

  remove(id: number) {
    return `This action removes a #${id} asset`;
  }
}
