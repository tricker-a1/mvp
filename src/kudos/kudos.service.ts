import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import { DateRangeDto, SendKudosDto } from './dto/kudos.dto.js';

@Injectable()
export class KudosService {
  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendKudosDto, user) {
    const userDB = await this.prisma.user.findFirst({
      where: { issuer: user.issuer },
    });
    if (userDB.kudos < dto.value)
      throw new BadRequestException(
        'The amount is more than what you have on your balance',
      );
    //TODO: Send BTC to Bitcoin addresses https://apidoc.tatum.io/tag/Bitcoin#operation/BtcTransferBlockchain
    const transaction = await this.prisma.kudosTransaction.create({
      data: {
        amount: dto.value,
        sender: { connect: { id: userDB.id } },
        recipient: { connect: { id: dto.recipient } },
        status: TransactionStatus.Pending,
      },
    });
    await this.prisma.user.update({
      where: { issuer: user.issuer },
      data: { kudos: userDB.kudos + dto.value },
    });
    return transaction;
  }

  async getTransactionFromUser(range: DateRangeDto, user) {
    const userDB = await this.prisma.user.findFirst({
      where: { issuer: user.issuer },
    });

    const date =
      range?.from && range?.to
        ? {
            gte: new Date(new Date(range.from).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(range.to).setHours(23, 59, 59, 999)),
          }
        : {};
    const transactions = await this.prisma.kudosTransaction.findMany({
      where: {
        sender: { id: userDB.id },
        createdAt: date,
      },
    });
    const chart = await this.prisma
      .$queryRaw`SELECT DATE("createdAt") "date", COUNT("id")::DECIMAL FROM "KudosTransaction" GROUP BY DATE("createdAt")`;

    const received = await this.prisma.kudosTransaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        recipientId: userDB.id,
      },
    });

    const given = await this.prisma.kudosTransaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        senderId: userDB.id,
      },
    });

    return {
      transactions,
      chart,
      received: received._sum.amount,
      given: given._sum.amount,
    };
  }
}
