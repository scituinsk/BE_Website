import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/auth.constants';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      BCRYPT_SALT_ROUNDS,
    );

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken: hashedRefreshToken,
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });
  }

  async findSessionByToken(refreshToken: string) {
    // Find all sessions and check token manually due to hashing
    const sessions = await this.prisma.session.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Only get non-expired sessions
        },
      },
      include: {
        user: true,
      },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
      if (isMatch) {
        return session;
      }
    }

    return null;
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
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      BCRYPT_SALT_ROUNDS,
    );

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
