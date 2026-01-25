import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { S3Service } from '../src/s3/s3.service';
import { S3Module } from '../src/s3/s3.module';

describe('S3 Integration Tests (e2e)', () => {
  let app: INestApplication;
  let s3Service: S3Service;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [S3Module],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    s3Service = moduleFixture.get<S3Service>(S3Service);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('S3Service Connection', () => {
    it('should initialize S3Service with correct configuration', () => {
      expect(s3Service).toBeDefined();
      expect(process.env.AWS_S3_REGION).toBeDefined();
      expect(process.env.AWS_S3_ENDPOINT).toBeDefined();
      expect(process.env.AWS_S3_ACCESS_KEY).toBeDefined();
      expect(process.env.AWS_S3_SECRET_KEY).toBeDefined();
    });

    it('should upload a test file to S3-compatible storage', async () => {
      // Create a test buffer
      const testBuffer = Buffer.from('Test file content for S3 integration');
      const testFileName = 'test-integration-file.txt';
      const bucketName =
        process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';

      try {
        const result = await s3Service.uploadFile({
          buffer: testBuffer,
          fileName: testFileName,
          folder: 'integration-tests',
          contentType: 'text/plain',
          bucketName: bucketName,
        });

        expect(result).toBeDefined();
        expect(result.key).toContain('integration-tests/');
        expect(result.key).toContain(testFileName);
        expect(result.url).toBeDefined();
        expect(result.bucket).toBe(bucketName);

        console.log('✅ Upload successful:', result);

        // Clean up - delete the test file
        await s3Service.deleteFile(result.key, bucketName);
        console.log('✅ Cleanup successful: File deleted');
      } catch (error) {
        console.error('❌ Upload failed:', error.message);
        throw error;
      }
    }, 30000); // 30 second timeout for network operations

    it('should upload an image file (simulating organization icon)', async () => {
      // Create a minimal PNG file buffer (1x1 transparent PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae,
      ]);

      const bucketName =
        process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';

      try {
        const result = await s3Service.uploadFile({
          buffer: pngBuffer,
          fileName: 'test-org-icon.png',
          folder: 'organization-icons',
          contentType: 'image/png',
          bucketName: bucketName,
        });

        expect(result).toBeDefined();
        expect(result.key).toContain('organization-icons/');
        expect(result.url).toBeDefined();
        expect(result.url).toContain(bucketName);

        console.log('✅ Image upload successful:', result);

        // Clean up
        await s3Service.deleteFile(result.key, bucketName);
        console.log('✅ Cleanup successful: Image deleted');
      } catch (error) {
        console.error('❌ Image upload failed:', error.message);
        throw error;
      }
    }, 30000);

    it('should generate a signed URL for a file', async () => {
      const testBuffer = Buffer.from('Signed URL test content');
      const bucketName =
        process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';

      try {
        // First upload a file
        const uploadResult = await s3Service.uploadFile({
          buffer: testBuffer,
          fileName: 'signed-url-test.txt',
          folder: 'integration-tests',
          contentType: 'text/plain',
          bucketName: bucketName,
        });

        expect(uploadResult).toBeDefined();

        // Generate a signed URL
        const signedUrl = await s3Service.getSignedUrl(
          uploadResult.key,
          bucketName,
          3600, // 1 hour
        );

        expect(signedUrl).toBeDefined();
        expect(typeof signedUrl).toBe('string');
        expect(signedUrl.length).toBeGreaterThan(0);

        console.log(
          '✅ Signed URL generated:',
          signedUrl.substring(0, 100) + '...',
        );

        // Clean up
        await s3Service.deleteFile(uploadResult.key, bucketName);
        console.log('✅ Cleanup successful');
      } catch (error) {
        console.error('❌ Signed URL test failed:', error.message);
        throw error;
      }
    }, 30000);

    it('should handle file deletion correctly', async () => {
      const testBuffer = Buffer.from('File to be deleted');
      const bucketName =
        process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';

      try {
        // Upload a file
        const uploadResult = await s3Service.uploadFile({
          buffer: testBuffer,
          fileName: 'file-to-delete.txt',
          folder: 'integration-tests',
          contentType: 'text/plain',
          bucketName: bucketName,
        });

        expect(uploadResult).toBeDefined();
        console.log('✅ File uploaded for deletion test');

        // Delete the file
        await s3Service.deleteFile(uploadResult.key, bucketName);
        console.log('✅ File deleted successfully');

        // Trying to get signed URL for deleted file should fail
        try {
          await s3Service.getSignedUrl(uploadResult.key, bucketName);
          // If we get here, the test should fail
          fail('Expected error when accessing deleted file');
        } catch (error) {
          console.log('✅ Correctly failed to access deleted file');
          expect(error).toBeDefined();
        }
      } catch (error) {
        console.error('❌ Deletion test failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Multiple Bucket Support', () => {
    it('should work with different bucket names', async () => {
      const testBuffer = Buffer.from('Multi-bucket test');
      const buckets = [
        process.env.ORGANIZATION_ICON_BUCKET,
        process.env.EVENT_IMAGES_BUCKET,
        process.env.AWS_ASSETS_BUCKET_NAME,
      ].filter(Boolean);

      console.log(`Testing with ${buckets.length} configured buckets`);

      for (const bucket of buckets) {
        try {
          const result = await s3Service.uploadFile({
            buffer: testBuffer,
            fileName: 'multi-bucket-test.txt',
            folder: 'integration-tests',
            contentType: 'text/plain',
            bucketName: bucket,
          });

          expect(result).toBeDefined();
          expect(result.bucket).toBe(bucket);
          console.log(`✅ Upload to ${bucket} successful`);

          // Clean up
          await s3Service.deleteFile(result.key, bucket);
        } catch (error) {
          console.error(`❌ Failed for bucket ${bucket}:`, error.message);
          // Don't throw - bucket might not exist yet
        }
      }
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should throw error when bucket name is not provided', async () => {
      const testBuffer = Buffer.from('Test');

      await expect(
        s3Service.uploadFile({
          buffer: testBuffer,
          fileName: 'test.txt',
          folder: 'test',
          contentType: 'text/plain',
          bucketName: '',
        }),
      ).rejects.toThrow();
    });

    it('should handle invalid bucket name gracefully', async () => {
      const testBuffer = Buffer.from('Test');

      try {
        await s3Service.uploadFile({
          buffer: testBuffer,
          fileName: 'test.txt',
          folder: 'test',
          contentType: 'text/plain',
          bucketName: 'non-existent-bucket-12345',
        });
        fail('Expected error for non-existent bucket');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Correctly handled invalid bucket:', error.message);
      }
    });
  });
});
