import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Company, Hashtag, Industry, Permission, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import {
  CreateCompanyDto,
  FireUsersDto,
  UpdateCompanyInfoDto,
  CompanyInfoSA,
  GetCardsInfo,
  AddCompanyCardDto,
  UpdateCompanyCardDto,
  CompanyUsersInfo,
  CompanyUserInfo,
} from './dto/company.dto.js';
import { StripeService } from '../stripe/stripe.service.js';
import { BalanceObject } from '../tatum/types/types.js';
import { TatumService } from '../tatum/tatum.service.js';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly tatumService: TatumService,
  ) {}

  async getCompaniesNames(): Promise<string[]> {
    const companiesNames = await this.prisma.company.findMany({
      select: { name: true },
    });
    const names = companiesNames.map((company) => company.name);
    return names;
  }

  async getCompanies(page: string): Promise<CompanyInfoSA[]> {
    if (Number(page) <= 0) {
      throw new HttpException(
        'Page must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    const take = 15;
    const skip = Number(page) * take - take;
    const companies: CompanyInfoSA[] = await this.prisma.company.findMany({
      skip,
      take,
      select: {
        id: true,
        name: true,
        industry: { select: { value: true } },
        logo: true,
        cards: { where: { isDefault: true } },
        customerId: true,
        website: true,
        _count: { select: { users: true } },
      },
    });

    for (const company of companies) {
      const billingAdmin = await this.prisma.user.findFirst({
        where: {
          companyId: company.id,
          role: Role.Admin,
          permissions: { has: Permission.ManageBillingInformation },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          avatar: true,
        },
      });
      company.billingAdmin = billingAdmin;
      const enrolledUsers = await this.prisma.user.count({
        where: { companyId: company.id, isEnrolled: true },
      });
      company.enrolledUsers = enrolledUsers;
      if (company.cards.length) {
        const card = await this.stripeService.getPaymentMethod(
          company.customerId,
          company.cards[0].paymentMethodId,
        );
        company.cardExpiringDate = card.exp_month + '/' + card.exp_year;
      } else {
        company.cardExpiringDate = null;
      }
      delete company.cards;
      delete company.customerId;
    }
    return companies;
  }

  async getCompany(
    issuer: string,
    companyId?: string,
  ): Promise<Company | CompanyInfoSA> {
    const user = await this.prisma.user.findFirst({ where: { issuer } });
    if (user.role == Role.Admin && user.companyId == companyId) {
      return await this.prisma.company.findFirst({
        where: { id: user.companyId },
        select: {
          id: true,
          name: true,
          industry: { select: { value: true } },
          logo: true,
          includeLogoOnWall: true,
          website: true,
          hashtags: { select: { hashtag: { select: { value: true } } } },
          size: true,
          _count: { select: { users: true } },
          brandColor: true,
          linkedin: true,
          facebook: true,
          twitter: true,
          country: true,
        },
      });
    }
    if (user.role == Role.SuperAdmin) {
      const company: CompanyInfoSA = await this.prisma.company.findFirst({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          logo: true,
          website: true,
          industry: { select: { value: true } },
          country: true,
          _count: { select: { users: true } },
          cards: true,
          customerId: true,
        },
      });
      const billingAdmin = await this.prisma.user.findFirst({
        where: {
          companyId: company.id,
          role: Role.Admin,
          permissions: { has: Permission.ManageBillingInformation },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          avatar: true,
        },
      });
      company.billingAdmin = billingAdmin;
      const enrolledUsers = await this.prisma.user.count({
        where: { companyId: company.id, isEnrolled: true },
      });
      company.enrolledUsers = enrolledUsers;
      if (company.cards.length) {
        const card = await this.stripeService.getPaymentMethod(
          company.customerId,
          company.cards[0].paymentMethodId,
        );
        company.cardExpiringDate = card.exp_month + '/' + card.exp_year;
      } else {
        company.cardExpiringDate = null;
      }
      delete company.cards;
      delete company.customerId;
      return company;
    }
  }

  getIndustries(): Promise<Industry[]> {
    return this.prisma.industry.findMany();
  }

  async getCompanyUsers(
    issuer: string,
    page: string,
  ): Promise<CompanyUsersInfo[]> {
    if (Number(page) <= 0) {
      throw new HttpException(
        'Page must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    const take = 15;
    const skip = Number(page) * take - take;
    const admin = await this.prisma.user.findFirst({ where: { issuer } });
    return await this.prisma.user.findMany({
      skip,
      take,
      where: { companyId: admin.companyId, isFired: false },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true,
        role: true,
        isEnrolled: true,
        addresses: true,
      },
    });
  }

  async getCompanyUser(issuer: string, id: string): Promise<CompanyUserInfo> {
    const admin = await this.prisma.user.findFirst({ where: { issuer } });
    const user: CompanyUserInfo = await this.prisma.user.findFirst({
      where: { id, companyId: admin.companyId },
      select: {
        id: true,
        issuer: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true,
        role: true,
        isEnrolled: true,
        isFired: true,
        phone: true,
        dateOfBirth: true,
        startOfWork: true,
        addresses: true,
      },
    });
    user.balance = (await this.tatumService.getBalance(
      user.addresses[0],
    )) as BalanceObject;
    return user;
  }

  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const { industryId, ...companyDtoToSave } = dto;
    return this.prisma.company.create({
      data: { ...companyDtoToSave, industry: { connect: { id: industryId } } },
    });
  }

  async updateCompanyInfo(
    issuer: string,
    dto: UpdateCompanyInfoDto,
  ): Promise<string> {
    const admin = await this.prisma.user.findFirst({ where: { issuer } });
    if (dto.hashtags) {
      const companyHashtags = await this.prisma.companyHashtag.findMany({
        where: { companyId: admin.companyId },
      });
      for (const ch of companyHashtags) {
        if (!dto.hashtags.includes(ch.hashtagId)) {
          await this.prisma.companyHashtag.delete({
            where: {
              companyId_hashtagId: {
                companyId: admin.companyId,
                hashtagId: ch.hashtagId,
              },
            },
          });
        }
      }
      await this.prisma.company.update({
        where: { id: admin.companyId },
        data: {
          ...dto,
          hashtags: {
            connectOrCreate: dto.hashtags.map((hashtag) => {
              return {
                where: {
                  companyId_hashtagId: {
                    companyId: admin.companyId,
                    hashtagId: hashtag,
                  },
                },
                create: { hashtagId: hashtag },
              };
            }),
          },
        },
      });
    } else {
      const { hashtags, ...dtoToSave } = dto;
      await this.prisma.company.update({
        where: { id: admin.companyId },
        data: {
          ...dtoToSave,
        },
      });
    }
    return 'Company info has been updated';
  }

  async fireUsers(issuer: string, dto: FireUsersDto): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: { issuer },
    });
    await this.prisma.user.updateMany({
      where: { id: { in: dto.users }, companyId: admin.companyId },
      data: { isFired: true, firingReason: dto.reason },
    });
    return 'Users have been fired';
  }

  async getHashtags(): Promise<Hashtag[]> {
    return await this.prisma.hashtag.findMany();
  }

  async createHashtag(value: string): Promise<Hashtag> {
    const hashtag = await this.prisma.hashtag.findFirst({ where: { value } });
    if (hashtag) {
      return hashtag;
    }
    return await this.prisma.hashtag.create({ data: { value } });
  }

  async getCardsDetails(issuer: string): Promise<GetCardsInfo[] | string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        permissions: { has: Permission.ManageBillingInformation },
      },
      include: { company: { select: { customerId: true, cards: true } } },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or he doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!admin.company.customerId) {
      return 'No cards';
    }
    const cardsInfo = await this.stripeService.getPaymentMethods(
      admin.company.customerId,
    );
    const cards: GetCardsInfo[] = [];
    for (const card of admin.company.cards) {
      const paymentMethod = cardsInfo.data.find(
        (paymentMethod) => paymentMethod.id == card.paymentMethodId,
      );
      cards.push({
        id: card.id,
        isDefault: card.isDefault,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        brand: paymentMethod.card.brand,
      });
    }
    return cards;
  }

  async addCard(issuer: string, dto: AddCompanyCardDto): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        permissions: { has: Permission.ManageBillingInformation },
      },
      include: {
        company: { select: { id: true, customerId: true, name: true } },
      },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or he doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!admin.company.customerId) {
      const customer = await this.stripeService.createCustomer(
        admin.email,
        dto.firstname,
        dto.lastname,
        admin.company.name,
      );
      await this.prisma.company.update({
        where: { id: admin.company.id },
        data: { customerId: customer.id },
      });
      const newPaymentMethod = await this.stripeService.createPaymentMethod({
        customerId: customer.id,
        ...dto,
        isDefault: true,
      });
      await this.prisma.card.create({
        data: {
          paymentMethodId: newPaymentMethod.id,
          isDefault: true,
          company: { connect: { id: admin.companyId } },
        },
      });
    } else {
      const allPaymentMethods = (
        await this.stripeService.getPaymentMethods(admin.company.customerId)
      ).data;
      if (!allPaymentMethods.length) {
        dto.isDefault = true;
      } else {
        const defaultCardExists = await this.prisma.card.findFirst({
          where: { companyId: admin.companyId, isDefault: true },
        });
        await this.prisma.card.update({
          where: { id: defaultCardExists.id },
          data: { isDefault: false },
        });
      }
      const newPaymentMethod = await this.stripeService.createPaymentMethod({
        customerId: admin.company.customerId,
        ...dto,
      });
      await this.prisma.card.create({
        data: {
          paymentMethodId: newPaymentMethod.id,
          isDefault: dto.isDefault,
          company: { connect: { id: admin.companyId } },
        },
      });
    }
    return 'Card has been saved';
  }

  async updateCard(
    issuer: string,
    id: string,
    dto: UpdateCompanyCardDto,
  ): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        permissions: { has: Permission.ManageBillingInformation },
      },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    const card = await this.prisma.card.findFirst({
      where: { id, companyId: admin.companyId },
      select: { paymentMethodId: true },
    });
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    await this.stripeService.updatePaymentMethod(card.paymentMethodId, dto);
    return 'Card info has been updated';
  }

  async makeCardDefault(issuer: string, id: string): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        permissions: { has: Permission.ManageBillingInformation },
      },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    const cardToMakeDefault = await this.prisma.card.findFirst({
      where: { id, companyId: admin.companyId },
      include: { company: { select: { customerId: true } } },
    });
    if (!cardToMakeDefault) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    const oldDefaultCard = await this.prisma.card.findFirst({
      where: { companyId: cardToMakeDefault.companyId, isDefault: true },
    });
    if (cardToMakeDefault.id == oldDefaultCard.id) {
      return 'Card is already default';
    }
    await this.stripeService.changeDefaultPaymentMethod(
      cardToMakeDefault.paymentMethodId,
      cardToMakeDefault.company.customerId,
    );
    await this.prisma.card.update({ where: { id }, data: { isDefault: true } });
    await this.prisma.card.update({
      where: { id: oldDefaultCard.id },
      data: { isDefault: false },
    });
    return 'Changes has been saved';
  }

  async deleteCard(issuer: string, id: string): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: { issuer },
    });
    const card = await this.prisma.card.findFirst({
      where: { id, companyId: admin.companyId },
      include: { company: { select: { customerId: true } } },
    });
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.card.delete({ where: { id } });
    if (card.isDefault) {
      const newDefaultCard = await this.prisma.card.findFirst({
        where: { companyId: card.companyId },
      });
      if (newDefaultCard) {
        await this.prisma.card.update({
          where: { id: newDefaultCard.id },
          data: { isDefault: true },
        });
        await this.stripeService.deletePaymentMethod(
          card.paymentMethodId,
          newDefaultCard.paymentMethodId,
          card.company.customerId,
        );
        return 'Card has been deleted';
      }
    }
    await this.stripeService.deletePaymentMethod(card.paymentMethodId);
    return 'Card has been deleted';
  }
}
