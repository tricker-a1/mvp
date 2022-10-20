import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class ActiveGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const userDB = await this.prisma.user.findFirst({
      where: { issuer: user.issuer },
    });
    if (!userDB) return false;

    if (userDB.role != Role.SuperAdmin) {
      if (userDB.isFired || !userDB.isEnrolled) {
        return false;
      }
    }

    return true;
  }
}
