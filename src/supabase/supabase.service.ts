import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  constructor() {
    const supabaseURL = process.env.API_URL!;
    const supabaseAPIKey = process.env.ANON_KEY!;
    this.supabase = createClient(supabaseURL, supabaseAPIKey);
  }

  getSupabase() {
    return this.supabase;
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    bucketName: string,
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async getFileUrl(fileName: string, bucketName: string) {
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(bucketName).getPublicUrl(fileName);

    return publicUrl;
  }
}
