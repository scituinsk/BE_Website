import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private endpoint: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(configService: ConfigService) {
    let rawEndpoint = configService.getOrThrow('S3_ENDPOINT');

    if (
      !rawEndpoint.startsWith('http://') &&
      !rawEndpoint.startsWith('https://')
    ) {
      rawEndpoint = `https://${rawEndpoint}`;
    }

    this.endpoint = rawEndpoint.replace(/\/$/, '');
    this.bucketName = configService.getOrThrow('S3_BUCKET');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: configService.getOrThrow('S3_REGION'),
      credentials: {
        accessKeyId: configService.getOrThrow('S3_ACCESS_KEY'),
        secretAccessKey: configService.getOrThrow('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    this.logger.log(`S3 initialized with endpoint: ${this.endpoint}`);
  }

  /**
   * Upload file (multer buffer)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
    acl: ObjectCannedACL = 'public-read',
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: acl,
      }),
    );

    return this.getPublicUrl(key);
  }

  /**
   * Upload file from URL (e.g., Gravatar → S3)
   */
  async uploadFromUrl(
    url: string,
    fileName: string,
    folder = 'avatars',
    acl: ObjectCannedACL = 'public-read',
  ): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download from ${url}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';
    const key = `${folder}/${fileName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: acl,
      }),
    );

    return this.getPublicUrl(key);
  }

  /**
   * Upload raw buffer directly
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType = 'application/octet-stream',
    folder = 'uploads',
    acl: ObjectCannedACL = 'public-read',
  ): Promise<string> {
    const key = `${folder}/${fileName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: acl,
      }),
    );

    return this.getPublicUrl(key);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.getKeyFromUrl(fileUrl);
    if (!key) throw new Error('Invalid file URL');

    await this.deleteFileByKey(key);
  }

  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate presigned URL for upload (PUT)
   * Frontend will use this URL to upload file directly to S3
   */
  async generatePresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder = 'uploads',
    expiresIn = 3600, // 1 hour default
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
    const fileUrl = this.getPublicUrl(key);

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Generate presigned URL for download (GET)
   * Use this for private files that need temporary access
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Delete file by key (extracted from URL or direct key)
   */
  async deleteFileByKey(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  /**
   * Get key from full URL
   */
  getKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      return parts.slice(2).join('/');
    } catch {
      return null;
    }
  }
}
