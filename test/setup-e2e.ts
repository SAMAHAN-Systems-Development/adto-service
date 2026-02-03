import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file before running tests
dotenv.config({ path: path.join(__dirname, '../.env') });
