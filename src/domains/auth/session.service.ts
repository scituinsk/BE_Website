import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const hashedRefreshToken = this.hashToken(refreshToken);

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken: hashedRefreshToken, // Simpan hash-nya
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });
  }

  /**
   * Menemukan sesi berdasarkan userId dan plain text refresh token.
   * NOTE: Anda HARUS mendapatkan userId (misalnya dari payload JWT yang kedaluwarsa)
   * untuk query yang efisien.
   */
  async findSessionByToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = this.hashToken(refreshToken);
    return this.prisma.session.findFirst({
      where: {
        userId: userId,
        refreshToken: hashedRefreshToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async findUserSessions(userId: number) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSession(
    sessionId: number,
    refreshToken: string,
    expiresAt: Date,
  ) {
    const hashedRefreshToken = this.hashToken(refreshToken);

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: hashedRefreshToken,
        expiresAt,
      },
    });
  }

  async deleteSession(sessionId: number) {
    return this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteUserSessions(userId: number) {
    return this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredSessions() {
    return this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
