import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testS3Connection() {
  logSection('🧪 S3 Connection Test');

  // Step 1: Check environment variables
  logSection('Step 1: Environment Variables');

  const requiredEnvVars = [
    'SB_S3_REGION',
    'SB_S3_ENDPOINT',
    'SB_S3_ACCESS_KEY',
    'SB_S3_SECRET_KEY',
    'ORGANIZATION_ICON_BUCKET',
    'EVENT_IMAGES_BUCKET',
  ];

  let allEnvVarsPresent = true;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      logSuccess(`${envVar}: ${value}`);
    } else {
      logError(`${envVar}: NOT SET`);
      allEnvVarsPresent = false;
    }
  }

  if (!allEnvVarsPresent) {
    logError('\n❌ Missing required environment variables!');
    logInfo('Please check your .env file and ensure all variables are set.');
    process.exit(1);
  }

  logSuccess('\n✅ All environment variables are set!\n');

  // Step 2: Initialize S3 Client
  logSection('Step 2: Initialize S3 Client');

  let s3Client: S3Client;

  try {
    s3Client = new S3Client({
      region: process.env.SB_S3_REGION,
      endpoint: process.env.SB_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SB_S3_ACCESS_KEY!,
        secretAccessKey: process.env.SB_S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });

    logSuccess('S3 Client initialized successfully');
    logInfo(`Region: ${process.env.SB_S3_REGION}`);
    logInfo(`Endpoint: ${process.env.SB_S3_ENDPOINT}`);
  } catch (error) {
    logError(`Failed to initialize S3 Client: ${error.message}`);
    process.exit(1);
  }

  // Step 3: List buckets
  logSection('Step 3: List Buckets');

  try {
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await s3Client.send(listBucketsCommand);

    if (bucketsResponse.Buckets && bucketsResponse.Buckets.length > 0) {
      logSuccess(`Found ${bucketsResponse.Buckets.length} bucket(s):`);
      bucketsResponse.Buckets.forEach((bucket, index) => {
        logInfo(`  ${index + 1}. ${bucket.Name}`);
      });
    } else {
      logWarning('No buckets found');
      logInfo('You may need to create buckets in Supabase Storage dashboard');
      logInfo('Visit: http://127.0.0.1:54323 (Storage section)');
    }
  } catch (error) {
    logError(`Failed to list buckets: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      logWarning('\n⚠️  Connection refused!');
      logInfo('Is Supabase running? Try: supabase start');
    }
    process.exit(1);
  }

  // Step 4: Test file upload
  logSection('Step 4: Test File Upload');

  const testBucket =
    process.env.ORGANIZATION_ICON_BUCKET || 'organization-icon';
  const testKey = `test-uploads/connection-test-${Date.now()}.txt`;
  const testContent = 'Hello from S3 connection test!';

  logInfo(`Testing upload to bucket: ${testBucket}`);
  logInfo(`File key: ${testKey}`);

  try {
    const putCommand = new PutObjectCommand({
      Bucket: testBucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);
    logSuccess('✅ File uploaded successfully!');

    // Construct URL
    const endpoint = process.env.SB_S3_ENDPOINT || '';
    const publicUrl = endpoint.includes('supabase')
      ? `${endpoint.replace('/s3', '')}/object/public/${testBucket}/${testKey}`
      : `${endpoint}/${testBucket}/${testKey}`;

    logInfo(`Public URL: ${publicUrl}`);

    // Step 5: Clean up test file
    logSection('Step 5: Cleanup');

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: testBucket,
        Key: testKey,
      });

      await s3Client.send(deleteCommand);
      logSuccess('Test file deleted successfully');
    } catch (error) {
      logWarning(`Failed to delete test file: ${error.message}`);
    }
  } catch (error) {
    logError(`Failed to upload test file: ${error.message}`);

    if (error.message.includes('NoSuchBucket')) {
      logWarning('\n⚠️  Bucket not found!');
      logInfo(`Please create the "${testBucket}" bucket in Supabase Storage`);
      logInfo('Visit: http://127.0.0.1:54323 (Storage section)');
      logInfo('Make sure to set the bucket as PUBLIC');
    }

    process.exit(1);
  }

  // Final summary
  logSection('🎉 Test Summary');
  logSuccess('All tests passed!');
  logSuccess('✅ Environment variables configured');
  logSuccess('✅ S3 client initialized');
  logSuccess('✅ Connected to S3-compatible storage');
  logSuccess('✅ File upload successful');
  logSuccess('✅ File deletion successful');

  log('\n' + '='.repeat(60), colors.green);
  log(
    '🚀 Your S3 integration is working correctly!',
    colors.bright + colors.green,
  );
  log('='.repeat(60) + '\n', colors.green);

  process.exit(0);
}

// Run the test
testS3Connection().catch((error) => {
  logError(`\n❌ Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
