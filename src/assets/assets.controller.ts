import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('event-banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEventBanner(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.assetsService.uploadEventBanner(file);
      return {
        message: 'Event banner uploaded successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload event banner',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })], // 10MB
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    try {
      const result = await this.assetsService.uploadAsset(file, folder);
      return {
        message: 'Asset uploaded successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload asset',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':key')
  async deleteAsset(@Param('key') key: string) {
    try {
      await this.assetsService.deleteAsset(key);
      return {
        message: 'Asset deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete asset',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('signed-url/:key')
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    try {
      const expires = expiresIn ? parseInt(expiresIn, 10) : undefined;
      const url = await this.assetsService.getSignedUrl(key, expires);
      return {
        message: 'Signed URL generated successfully',
        data: { url },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate signed URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
