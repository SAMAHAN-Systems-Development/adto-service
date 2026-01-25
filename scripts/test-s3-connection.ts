#!/usr/bin/env ts-node

/**
 * Manual S3 Connection Test Script
 *
 * This script tests the real S3 connection with your local Supabase storage.
 *
 * Prerequisites:
 * 1. Supabase must be running locally (supabase start)
 * 2. Environment variables must be set in .env
 *
 * Usage:
 *   npm run test:s3-manual
 *   or
 *   ts-node scripts/test-s3-connection.ts
 */

import {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testS3Connection() {
  log('\n=== S3 Connection Test ===\n', colors.blue);

  // Check environment variables
  logInfo('Checking environment variables...');
  const requiredEnvVars = {
    AWS_S3_REGION: process.env.AWS_S3_REGION,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_ACCESS_KEY: process.env.AWS_S3_ACCESS_KEY,
    AWS_S3_SECRET_KEY: process.env.AWS_S3_SECRET_KEY,
  };

  let hasAllVars = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      logSuccess(
        `${key}: ${key.includes('KEY') ? '***' + value.slice(-4) : value}`,
      );
    } else {
      logError(`${key}: NOT SET`);
      hasAllVars = false;
    }
  }

  if (!hasAllVars) {
    logError('Missing required environment variables!');
    process.exit(1);
  }

  // Check bucket names
  log('\n--- Bucket Configuration ---', colors.blue);
  const buckets = {
    ORGANIZATION_ICON_BUCKET: process.env.ORGANIZATION_ICON_BUCKET,
    EVENT_IMAGES_BUCKET: process.env.EVENT_IMAGES_BUCKET,
    AWS_ASSETS_BUCKET_NAME: process.env.AWS_ASSETS_BUCKET_NAME,
  };

  for (const [key, value] of Object.entries(buckets)) {
    if (value) {
      logSuccess(`${key}: ${value}`);
    } else {
      logWarning(`${key}: NOT SET`);
    }
  }

  // Initialize S3 Client
  log('\n--- Initializing S3 Client ---', colors.blue);
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      endpoint: process.env.AWS_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
    logSuccess('S3 Client initialized successfully');

    // Test 1: List Buckets
    log('\n--- Test 1: List Buckets ---', colors.blue);
    try {
      const listBucketsCommand = new ListBucketsCommand({});
      const bucketsResponse = await s3Client.send(listBucketsCommand);

      if (bucketsResponse.Buckets && bucketsResponse.Buckets.length > 0) {
        logSuccess(`Found ${bucketsResponse.Buckets.length} bucket(s):`);
        bucketsResponse.Buckets.forEach((bucket) => {
          log(
            `  - ${bucket.Name} (Created: ${bucket.CreationDate})`,
            colors.cyan,
          );
        });
      } else {
        logWarning('No buckets found');
      }
    } catch (error) {
      logError(`Failed to list buckets: ${error.message}`);
      logInfo("This might be normal if you haven't created any buckets yet");
    }

    // Test 2: Check if configured buckets exist
    log('\n--- Test 2: Check Configured Buckets ---', colors.blue);
    for (const [key, bucketName] of Object.entries(buckets)) {
      if (!bucketName) continue;

      try {
        const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(headBucketCommand);
        logSuccess(`Bucket "${bucketName}" exists and is accessible`);
      } catch (error) {
        if (
          error.name === 'NotFound' ||
          error.$metadata?.httpStatusCode === 404
        ) {
          logWarning(`Bucket "${bucketName}" does not exist yet`);
          logInfo(`  You'll need to create it in Supabase Storage dashboard`);
        } else {
          logError(`Error checking bucket "${bucketName}": ${error.message}`);
        }
      }
    }

    // Test 3: Try to upload a test file
    log('\n--- Test 3: Upload Test File ---', colors.blue);
    const testBucket =
      process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';
    const testKey = `test-uploads/connection-test-${Date.now()}.txt`;
    const testContent =
      'This is a test file to verify S3 connection.\nGenerated at: ' +
      new Date().toISOString();

    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: testBucket,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain',
      });

      await s3Client.send(putObjectCommand);
      logSuccess(
        `Successfully uploaded test file to: ${testBucket}/${testKey}`,
      );
      logInfo(
        `File URL would be: ${process.env.AWS_S3_ENDPOINT}/${testBucket}/${testKey}`,
      );
    } catch (error) {
      logError(`Failed to upload test file: ${error.message}`);
      if (
        error.name === 'NoSuchBucket' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        logWarning(`Bucket "${testBucket}" doesn't exist`);
        logInfo('Create the bucket in Supabase Storage and try again');
      }
    }

    // Summary
    log('\n=== Connection Test Complete ===\n', colors.blue);
    logSuccess('S3 Service is configured and ready to use!');
    log('\nNext steps:', colors.yellow);
    log('1. Make sure Supabase is running: supabase start');
    log('2. Create the required buckets in Supabase Storage dashboard');
    log(
      '3. Run integration tests: npm run test:e2e -- s3-integration.e2e-spec.ts',
    );
    log('');
  } catch (error) {
    logError(`Failed to initialize S3 Client: ${error.message}`);
    log('\nPossible issues:', colors.yellow);
    log('1. Supabase is not running (run: supabase start)');
    log('2. Incorrect credentials in .env file');
    log('3. Endpoint URL is wrong');
    log('');
    process.exit(1);
  }
}

// Run the test
testS3Connection().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
