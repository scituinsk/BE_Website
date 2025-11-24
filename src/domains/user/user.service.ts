import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

import { S3Service } from '../../infra/s3/s3.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/auth.constants';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        avatarImage: true,
      },
    });
  }

  async create(data: {
    name: string;
    username: string; // username is email
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // Generate avatar key
    const avatarKey = `avatars/user-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.png`;

    // Generate Gravatar URL
    const gravatarUrl = this.generateGravatarUrl(Date.now()); // Use timestamp as temp ID

    let s3Url: string;

    // Upload to S3 first, before creating user in database
    try {
      const fileName = avatarKey.split('/').pop() || 'avatar.png';
      s3Url = await this.s3Service.uploadFromUrl(
        gravatarUrl,
        fileName,
        'avatars',
      );
      this.logger.log(`Avatar uploaded to S3: ${s3Url}`);
    } catch (error) {
      this.logger.error(`Failed to upload avatar to S3: ${error.message}`);
      throw new Error('Failed to upload avatar. User creation cancelled.');
    }

    // If S3 upload successful, create user with transaction
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user with avatar image record
        const newUser = await tx.user.create({
          data: {
            username: data.username,
            password: hashedPassword,
            name: data.name,
            avatarImage: {
              create: {
                key: avatarKey,
                imageUrl: s3Url,
              },
            },
          },
          include: {
            avatarImage: true,
          },
        });

        return newUser;
      });

      this.logger.log(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      // If database transaction fails, delete uploaded file from S3
      this.logger.error(
        `Failed to create user in database: ${error.message}. Rolling back S3 upload...`,
      );

      try {
        await this.s3Service.deleteFileByKey(avatarKey);
        this.logger.log(`Rolled back S3 upload for key: ${avatarKey}`);
      } catch (deleteError) {
        this.logger.error(
          `Failed to rollback S3 upload: ${deleteError.message}`,
        );
      }

      throw error;
    }
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

    const oldAvatarKey = user.avatarImageId;

    // Generate new avatar key
    const newAvatarKey = `avatars/user-${userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.png`;

    let s3Url: string;

    // Upload to S3 first
    try {
      if (file) {
        // Upload custom image
        s3Url = await this.s3Service.uploadFile(file, 'avatars');
      } else {
        // Regenerate from Gravatar
        const gravatarUrl = this.generateGravatarUrl(userId);
        const fileName = newAvatarKey.split('/').pop() || `user-${userId}.png`;
        s3Url = await this.s3Service.uploadFromUrl(
          gravatarUrl,
          fileName,
          'avatars',
        );
      }
      this.logger.log(`New avatar uploaded to S3: ${s3Url}`);
    } catch (error) {
      this.logger.error(`Failed to upload new avatar: ${error.message}`);
      throw new Error('Failed to upload avatar');
    }

    // If S3 upload successful, update database with transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        // Mark old avatar as deleted if exists
        if (oldAvatarKey) {
          await tx.avatarImage.update({
            where: { key: oldAvatarKey },
            data: { deletedAt: new Date() },
          });
        }

        // Create new avatar image record
        await tx.avatarImage.create({
          data: {
            key: newAvatarKey,
            imageUrl: s3Url,
          },
        });

        // Update user with new avatar
        await tx.user.update({
          where: { id: userId },
          data: { avatarImageId: newAvatarKey },
        });
      });

      this.logger.log(`Avatar updated successfully for user ${userId}`);
      return s3Url;
    } catch (error) {
      // If database transaction fails, delete uploaded file from S3
      this.logger.error(
        `Failed to update avatar in database: ${error.message}. Rolling back S3 upload...`,
      );

      try {
        await this.s3Service.deleteFileByKey(newAvatarKey);
        this.logger.log(`Rolled back S3 upload for key: ${newAvatarKey}`);
      } catch (deleteError) {
        this.logger.error(
          `Failed to rollback S3 upload: ${deleteError.message}`,
        );
      }

      throw error;
    }
  }

  async delete(userId: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return true;
    }

    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return true;
  }

  /**
   * Delete user avatar (soft delete)
   */
  async deleteAvatar(userId: number): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.avatarImageId) {
      // Soft delete avatar
      await this.prisma.avatarImage.update({
        where: { key: user.avatarImageId },
        data: { deletedAt: new Date() },
      });

      // Remove reference from user
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarImageId: null },
      });
    }
  }

  /**
   * Cleanup deleted avatars (called by cronjob)
   * Deletes from S3 and database
   */
  async cleanupDeletedAvatars(): Promise<{
    total: number;
    deleted: number;
    failed: number;
  }> {
    const deletedAvatars = await this.prisma.avatarImage.findMany({
      where: {
        users: null,
        deletedAt: {
          not: null,
        },
      },
    });

    this.logger.log(
      `Found ${deletedAvatars.length} deleted avatars to clean up`,
    );

    let deletedCount = 0;
    let failedCount = 0;

    for (const avatar of deletedAvatars) {
      try {
        // Delete from S3
        await this.s3Service.deleteFileByKey(avatar.key);

        // Delete from database
        await this.prisma.avatarImage.delete({
          where: { id: avatar.id },
        });

        deletedCount++;
        this.logger.log(`Deleted avatar: ${avatar.key}`);
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Failed to delete avatar ${avatar.key}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Cleanup completed: ${deletedCount} deleted, ${failedCount} failed`,
    );

    return {
      total: deletedAvatars.length,
      deleted: deletedCount,
      failed: failedCount,
    };
  }

  /**
   * Get avatar URL by user ID
   */
  async getAvatarUrl(userId: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { avatarImage: true },
    });

    if (!user || !user.avatarImage || user.avatarImage.deletedAt) {
      return null;
    }

    // Return URL directly from database
    return user.avatarImage.imageUrl || null;
  }
}
