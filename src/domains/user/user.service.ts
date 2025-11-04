import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../infra/database/prisma.service';
import { S3Service } from '../../infra/s3/s3.service';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/auth.constants';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async findOne(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    username: string; // username is email
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // Create user first to get the ID
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
      },
    });

    // Generate avatar and upload to S3
    try {
      const avatarUrl = await this.generateAndUploadAvatar(user.id);

      // Update user with S3 avatar URL
      return this.prisma.user.update({
        where: { id: user.id },
        data: { image: avatarUrl },
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload avatar for user ${user.id}: ${error.message}`,
      );
      // Return user without avatar if upload fails
      return user;
    }
  }

  /**
   * Generate Gravatar URL and upload to S3
   * Returns S3 URL
   */
  async generateAndUploadAvatar(userId: number): Promise<string> {
    // Generate Gravatar URL
    const gravatarUrl = this.generateGravatarUrl(userId);

    // Download from Gravatar and upload to S3
    const fileName = `user-${userId}-${Date.now()}.png`;
    const s3Url = await this.s3Service.uploadFromUrl(
      gravatarUrl,
      fileName,
      'avatars',
    );

    this.logger.log(`Avatar uploaded to S3 for user ${userId}: ${s3Url}`);
    return s3Url;
  }

  /**
   * Generate Gravatar URL based on user ID
   */
  generateGravatarUrl(userId: number): string {
    const hash = crypto
      .createHash('md5')
      .update(userId.toString())
      .digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=500&d=retro&r=g`;
  }

  /**
   * Update user avatar (upload custom image or regenerate from Gravatar)
   */
  async updateAvatar(
    userId: number,
    file?: Express.Multer.File,
  ): Promise<string> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Delete old avatar from S3 if exists
    if (user.image) {
      try {
        await this.s3Service.deleteFile(user.image);
      } catch (error) {
        this.logger.warn(`Failed to delete old avatar: ${error.message}`);
      }
    }

    let newAvatarUrl: string;

    if (file) {
      // Upload custom image
      newAvatarUrl = await this.s3Service.uploadFile(file, 'avatars');
    } else {
      // Regenerate from Gravatar
      newAvatarUrl = await this.generateAndUploadAvatar(userId);
    }

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: { image: newAvatarUrl },
    });

    return newAvatarUrl;
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: number): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.image) {
      await this.s3Service.deleteFile(user.image);
      await this.prisma.user.update({
        where: { id: userId },
        data: { image: null },
      });
    }
  }
}
