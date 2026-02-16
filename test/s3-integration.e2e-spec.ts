import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../src/s3/s3.service';

describe('S3 Integration Tests (e2e)', () => {
  let s3Service: S3Service;
  const testBucketName =
    process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    s3Service = moduleFixture.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      expect(process.env.SB_S3_REGION).toBeDefined();
      expect(process.env.SB_S3_ENDPOINT).toBeDefined();
      expect(process.env.SB_S3_ACCESS_KEY).toBeDefined();
      expect(process.env.SB_S3_SECRET_KEY).toBeDefined();
      expect(process.env.ORGANIZATION_ICON_BUCKET).toBeDefined();
    });

    it('should initialize S3Service successfully', () => {
      expect(s3Service).toBeDefined();
    });
  });

  describe('File Upload', () => {
    it('should upload a text file successfully', async () => {
      const testContent = 'Hello S3!';
      const buffer = Buffer.from(testContent);

      const result = await s3Service.uploadFile({
        buffer,
        fileName: 'test-file.txt',
        folder: 'test-uploads',
        contentType: 'text/plain',
        bucketName: testBucketName,
      });

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.key).toContain('test-uploads');
      expect(result.key).toContain('.txt');
      expect(result.bucket).toBe(testBucketName);

      // Cleanup
      await s3Service.deleteFile(result.key, testBucketName);
    });

    it('should upload an image file successfully', async () => {
      // Create a minimal valid JPEG file (1x1 pixel)
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
        0x7f, 0x80, 0xff, 0xd9,
      ]);

      const result = await s3Service.uploadFile({
        buffer: jpegBuffer,
        fileName: 'test-image.jpg',
        folder: 'test-images',
        contentType: 'image/jpeg',
        bucketName: testBucketName,
      });

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.key).toContain('test-images');
      expect(result.key).toContain('.jpg');

      // Cleanup
      await s3Service.deleteFile(result.key, testBucketName);
    });

    it('should generate unique keys for multiple uploads', async () => {
      const buffer = Buffer.from('test content');

      const result1 = await s3Service.uploadFile({
        buffer,
        fileName: 'test.txt',
        folder: 'test-unique',
        contentType: 'text/plain',
        bucketName: testBucketName,
      });

      const result2 = await s3Service.uploadFile({
        buffer,
        fileName: 'test.txt',
        folder: 'test-unique',
        contentType: 'text/plain',
        bucketName: testBucketName,
      });

      expect(result1.key).not.toBe(result2.key);

      // Cleanup
      await s3Service.deleteFile(result1.key, testBucketName);
      await s3Service.deleteFile(result2.key, testBucketName);
    });

    it('should throw error when bucket name is missing', async () => {
      const buffer = Buffer.from('test');

      await expect(
        s3Service.uploadFile({
          buffer,
          fileName: 'test.txt',
          contentType: 'text/plain',
          bucketName: '',
        }),
      ).rejects.toThrow('Bucket name is required');
    });
  });

  describe('File Deletion', () => {
    it('should delete a file successfully', async () => {
      // First, upload a file
      const buffer = Buffer.from('temporary file');
      const uploadResult = await s3Service.uploadFile({
        buffer,
        fileName: 'temp-file.txt',
        folder: 'test-delete',
        contentType: 'text/plain',
        bucketName: testBucketName,
      });

      // Then delete it
      await expect(
        s3Service.deleteFile(uploadResult.key, testBucketName),
      ).resolves.not.toThrow();
    });

    it('should throw error when deleting with missing bucket name', async () => {
      await expect(s3Service.deleteFile('some-key', '')).rejects.toThrow(
        'Bucket name is required',
      );
    });
  });

  describe('Signed URLs', () => {
    it('should generate a signed URL successfully', async () => {
      // First upload a file
      const buffer = Buffer.from('signed url test');
      const uploadResult = await s3Service.uploadFile({
        buffer,
        fileName: 'signed-test.txt',
        folder: 'test-signed',
        contentType: 'text/plain',
        bucketName: testBucketName,
      });

      // Generate signed URL
      const signedUrl = await s3Service.getSignedUrl(
        uploadResult.key,
        testBucketName,
        3600,
      );

      expect(signedUrl).toBeDefined();
      expect(typeof signedUrl).toBe('string');
      expect(signedUrl.length).toBeGreaterThan(0);

      // Cleanup
      await s3Service.deleteFile(uploadResult.key, testBucketName);
    });

    it('should throw error when generating signed URL with missing bucket', async () => {
      await expect(
        s3Service.getSignedUrl('some-key', '', 3600),
      ).rejects.toThrow('Bucket name is required');
    });
  });

  describe('Multiple Bucket Support', () => {
    it('should upload to different buckets successfully', async () => {
      const buffer = Buffer.from('multi-bucket test');
      const bucket1 =
        process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';
      const bucket2 = process.env.EVENT_IMAGES_BUCKET || 'event-images';

      const result1 = await s3Service.uploadFile({
        buffer,
        fileName: 'test1.txt',
        contentType: 'text/plain',
        bucketName: bucket1,
      });

      const result2 = await s3Service.uploadFile({
        buffer,
        fileName: 'test2.txt',
        contentType: 'text/plain',
        bucketName: bucket2,
      });

      expect(result1.bucket).toBe(bucket1);
      expect(result2.bucket).toBe(bucket2);

      // Cleanup
      await s3Service.deleteFile(result1.key, bucket1);
      await s3Service.deleteFile(result2.key, bucket2);
    });
  });
});
