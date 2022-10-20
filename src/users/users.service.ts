import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Permission, Role, User } from '@prisma/client';
import { SendgridService } from '../sendgrid/sendgrid.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { TatumService } from '../tatum/tatum.service.js';
import { PrismaService } from '../prisma.service.js';
import {
  AddUserCardDto,
  UpdateUserCardDto,
  ChangeUserRole,
  CreateSuperAdminDto,
  RegisterAdminDto,
  RegisterEmployeeDto,
  SetUserPermissions,
  GetCardsInfo,
  UpdateMyProfileDto,
  UsersInfoSA,
  UserInfoSA,
  CompleteEmployeeRegistrationDto,
  CompleteAdminRegistrationDto,
} from './dto/user.dto.js';
import { parseCSV } from '../utils/csv-parse.js';
import { CompaniesService } from '../companies/companies.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgridService: SendgridService,
    private readonly stripeService: StripeService,
    private readonly tatumService: TatumService,
    private readonly companiesService: CompaniesService,
  ) {}

  getMy(issuer: string): Promise<User> {
    return this.prisma.user.findFirst({ where: { issuer } });
  }

  async getAllUsers(page: string): Promise<UsersInfoSA[]> {
    if (Number(page) <= 0) {
      throw new HttpException(
        'Page must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    const take = 15;
    const skip = Number(page) * take - take;
    const users: UsersInfoSA[] = await this.prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true,
        role: true,
        company: { select: { id: true, name: true, logo: true, size: true } },
        addresses: true,
        country: true,
        isEnrolled: true,
        isFired: true,
        cards: true,
        customerId: true,
      },
    });
    for (const user of users) {
      if (user.cards.length) {
        const card = await this.stripeService.getPaymentMethod(
          user.customerId,
          user.cards[0].paymentMethodId,
        );
        user.cardExpiringDate = card.exp_month + '/' + card.exp_year;
      } else {
        user.cardExpiringDate = null;
      }
      delete user.cards;
      delete user.customerId;
    }
    return users;
  }

  async getUser(id: string): Promise<UserInfoSA> {
    const user: UserInfoSA = await this.prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            size: true,
            website: true,
            country: true,
          },
        },
        addresses: true,
        isEnrolled: true,
        isFired: true,
        cards: true,
        customerId: true,
      },
    });
    if (user.cards.length) {
      const card = await this.stripeService.getPaymentMethod(
        user.customerId,
        user.cards[0].paymentMethodId,
      );
      user.cardExpiringDate = card.exp_month + '/' + card.exp_year;
    } else {
      user.cardExpiringDate = null;
    }
    delete user.cards;
    delete user.customerId;
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.prisma.user.findFirst({ where: { email } });
  }

  async registerUser(
    issuer: string,
    dto: RegisterEmployeeDto | RegisterAdminDto,
  ): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, role: { in: [Role.Employee, Role.Admin] } },
    });
    if (!user) {
      throw new HttpException(
        "Something went wrong. Maybe you weren't invited",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.isEnrolled) {
      throw new HttpException(
        'User is already enrolled',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.role == Role.Employee) {
      const employeeDto = dto as RegisterEmployeeDto;
      return this.prisma.user.update({
        where: { email: dto.email },
        data: {
          ...employeeDto,
          issuer,
          permissions: [],
        },
      });
    }
    const adminDto = dto as RegisterAdminDto;
    return this.prisma.user.update({
      where: { email: adminDto.email },
      data: {
        ...adminDto,
        issuer,
        permissions: [
          Permission.InviteEmployees,
          Permission.ManageBillingInformation,
          Permission.SetPermissionsForOthers,
        ],
      },
    });
  }

  async completeUserRegistration(
    issuer: string,
    dto: CompleteEmployeeRegistrationDto | CompleteAdminRegistrationDto,
  ): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { issuer, role: { in: [Role.Employee, Role.Admin] } },
    });
    if (!user) {
      throw new HttpException(
        "Something went wrong. Maybe you weren't invited",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.isEnrolled) {
      throw new HttpException(
        'User is already enrolled',
        HttpStatus.BAD_REQUEST,
      );
    }
    dto.startOfWork = new Date(dto.startOfWork);
    dto.dateOfBirth = new Date(dto.dateOfBirth);
    if (user.role == Role.Employee) {
      const employeeDto = dto as CompleteEmployeeRegistrationDto;
      return this.prisma.user.update({
        where: { issuer },
        data: {
          ...employeeDto,
          isEnrolled: true,
        },
      });
    }
    const adminDto = dto as CompleteAdminRegistrationDto;
    const { companyDto, ...adminDtoToSave } = adminDto;
    const company = await this.companiesService.createCompany(companyDto);
    return this.prisma.user.update({
      where: { issuer },
      data: {
        ...adminDtoToSave,
        isEnrolled: true,
        company: { connect: { id: company.id } },
      },
    });
  }

  async createSuperAdmin(
    issuer: string,
    dto: CreateSuperAdminDto,
  ): Promise<User> {
    const user = await this.prisma.user.create({
      data: { ...dto, issuer: issuer, isEnrolled: true, isFired: null },
    });
    return user;
  }

  async updateMyProfile(
    issuer: string,
    dto: UpdateMyProfileDto,
  ): Promise<string> {
    if (dto.startOfWork) {
      dto.startOfWork = new Date(dto.startOfWork);
    }
    await this.prisma.user.update({
      where: { issuer },
      data: { ...dto },
    });
    return 'User info has been updated';
  }

  async changeUserRole(issuer: string, dto: ChangeUserRole): Promise<string> {
    if (dto.role == Role.SuperAdmin) {
      throw new HttpException(
        "Сan't change user role to super admin",
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, isFired: false, isEnrolled: true },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }
    if (user.role == Role.SuperAdmin) {
      throw new HttpException(
        "Сan't change this user's role",
        HttpStatus.BAD_REQUEST,
      );
    }
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        role: Role.Admin,
        permissions: { has: Permission.SetPermissionsForOthers },
        isFired: false,
        isEnrolled: true,
      },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or he doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.role == Role.Admin) {
      dto.permissions = [Permission.InviteEmployees];
    } else {
      dto.permissions = [];
    }
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: dto.role, permissions: dto.permissions },
    });
    return 'Settings have been updated';
  }

  async setUserPermissions(
    issuer: string,
    dto: SetUserPermissions,
  ): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer,
        role: Role.Admin,
        permissions: { has: Permission.SetPermissionsForOthers },
      },
    });
    if (!admin) {
      throw new HttpException(
        "Admin not found or he doesn't have enough permissions to do these operations",
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, isFired: false, isEnrolled: true },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (user.role != Role.Admin) {
      throw new HttpException(
        'User must be an admin to give him permissions',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.role != Role.Admin) {
      throw new HttpException(
        'User must be an admin to give him permissions',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { permissions: dto.permissions },
    });
    return 'Settings have been updated';
  }

  async deleteUser(issuer: string): Promise<string> {
    const user = await this.prisma.user.delete({
      where: { issuer },
      include: { cards: { select: { id: true } } },
    });
    if (!user) {
      return;
    }
    if (user.cards.length) {
      await this.prisma.card.deleteMany({ where: { userId: user.id } });
      await this.stripeService.deleteCustomer(user.customerId);
    }
    return 'User has been deleted';
  }

  async inviteUsers(
    file,
    adminIssuer: string,
    emails: string[] = [],
  ): Promise<string> {
    if (!file && !emails.length) {
      throw new HttpException(
        'Please specify emails, or upload an csv file',
        HttpStatus.BAD_REQUEST,
      );
    }
    let emailsFromCsv: string[] = [];
    if (file) {
      emailsFromCsv = await parseCSV(file);
    }
    const allEmails = Array.prototype.concat(emailsFromCsv, emails);
    const admin = await this.prisma.user.findFirst({
      where: {
        issuer: adminIssuer,
        role: Role.Admin,
        permissions: { has: Permission.InviteEmployees },
      },
    });

    if (!admin) {
      throw new HttpException(
        "Admin not found or doesn't have enough permissions",
        HttpStatus.BAD_REQUEST,
      );
    }
    const usersExists = await this.prisma.user.findMany({
      where: { email: { in: allEmails } },
      select: { email: true },
    });
    for (const email of allEmails) {
      const user = usersExists.find((user) => {
        return user.email == email;
      });
      if (user) {
        continue;
      }
      await this.prisma.user.create({
        data: {
          email,
          role: Role.Employee,
          isEnrolled: false,
          inviterId: admin.id,
          company: { connect: { id: admin.companyId } },
        },
      });
      const mail = {
        to: email,
        subject: 'Hello from sendgrid',
        from: process.env.FROM_EMAIL,
        text: 'Hello',
        html: '<h1>Hello</h1>',
      };
      await this.sendgridService.send(mail);
    }
    return 'Invites have been sent to new users';
  }

  async inviteAdmins(file, emails: string[] = []): Promise<string> {
    if (!file && !emails.length) {
      throw new HttpException(
        'Please specify emails, or upload an csv file',
        HttpStatus.BAD_REQUEST,
      );
    }
    let emailsFromCsv: string[] = [];
    if (file) {
      emailsFromCsv = await parseCSV(file);
    }
    const allEmails = Array.prototype.concat(emailsFromCsv, emails);
    const usersExists = await this.prisma.user.findMany({
      where: { email: { in: allEmails } },
      select: { email: true },
    });
    for (const email of allEmails) {
      const user = usersExists.find((user) => {
        return user.email == email;
      });
      if (user) {
        continue;
      }
      await this.prisma.user.create({
        data: {
          email,
          role: Role.Admin,
          isEnrolled: false,
        },
      });
      const mail = {
        to: email,
        subject: 'Hello from sendgrid',
        from: process.env.FROM_EMAIL,
        text: 'Hello',
        html: '<h1>Hello</h1>',
      };
      await this.sendgridService.send(mail);
    }
    return 'Invites have been sent';
  }

  async getCardsDetails(issuer: string): Promise<GetCardsInfo[] | string> {
    const user = await this.prisma.user.findFirst({
      where: { issuer },
      include: { cards: true },
    });
    if (!user.customerId) {
      return 'No cards';
    }
    const cardsInfo = await this.stripeService.getPaymentMethods(
      user.customerId,
    );
    const cards: GetCardsInfo[] = [];
    for (const card of user.cards) {
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

  async addCard(issuer: string, dto: AddUserCardDto): Promise<string> {
    const user = await this.prisma.user.findFirst({ where: { issuer } });
    if (!user.customerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        dto.firstname,
        dto.lastname,
      );
      await this.prisma.user.update({
        where: { id: user.id },
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
          user: { connect: { id: user.id } },
        },
      });
    } else {
      const allPaymentMethods = (
        await this.stripeService.getPaymentMethods(user.customerId)
      ).data;
      if (!allPaymentMethods.length) {
        dto.isDefault = true;
      } else {
        const defaultCardExists = await this.prisma.card.findFirst({
          where: { userId: user.id, isDefault: true },
        });
        await this.prisma.card.update({
          where: { id: defaultCardExists.id },
          data: { isDefault: false },
        });
      }
      const newPaymentMethod = await this.stripeService.createPaymentMethod({
        customerId: user.customerId,
        ...dto,
      });
      await this.prisma.card.create({
        data: {
          paymentMethodId: newPaymentMethod.id,
          isDefault: dto.isDefault,
          user: { connect: { id: user.id } },
        },
      });
    }
    return 'Card has been saved';
  }

  async updateCard(
    issuer: string,
    id: string,
    dto: UpdateUserCardDto,
  ): Promise<string> {
    const card = await this.prisma.card.findFirst({
      where: { id, user: { issuer } },
      select: { paymentMethodId: true },
    });
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    await this.stripeService.updatePaymentMethod(card.paymentMethodId, dto);
    return 'Card info has been updated';
  }

  async makeCardDefault(issuer: string, cardId: string): Promise<string> {
    const cardToMakeDefault = await this.prisma.card.findFirst({
      where: { id: cardId, user: { issuer } },
      include: { user: { select: { customerId: true } } },
    });
    if (!cardToMakeDefault) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    const oldDefaultCard = await this.prisma.card.findFirst({
      where: { userId: cardToMakeDefault.userId, isDefault: true },
    });
    if (cardToMakeDefault.id == oldDefaultCard.id) {
      return 'Card is already default';
    }
    await this.stripeService.changeDefaultPaymentMethod(
      cardToMakeDefault.paymentMethodId,
      cardToMakeDefault.user.customerId,
    );
    await this.prisma.card.update({
      where: { id: cardId },
      data: { isDefault: true },
    });
    await this.prisma.card.update({
      where: { id: oldDefaultCard.id },
      data: { isDefault: false },
    });
    return 'Changes has been saved';
  }

  async deleteCard(issuer: string, id: string): Promise<string> {
    const card = await this.prisma.card.findFirst({
      where: { id, user: { issuer } },
      include: { user: { select: { customerId: true } } },
    });
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.card.delete({ where: { id } });
    if (card.isDefault) {
      const newDefaultCard = await this.prisma.card.findFirst({
        where: { userId: card.userId },
      });
      if (newDefaultCard) {
        await this.prisma.card.update({
          where: { id: newDefaultCard.id },
          data: { isDefault: true },
        });
        await this.stripeService.deletePaymentMethod(
          card.paymentMethodId,
          newDefaultCard.paymentMethodId,
          card.user.customerId,
        );
        return 'Card has been deleted';
      }
    }
    await this.stripeService.deletePaymentMethod(card.paymentMethodId);
    return 'Card has been deleted';
  }

  async createWallet(issuer: string, mnemonic: string) {
    const wallet = await this.tatumService.generateWallet(mnemonic);
    const address = await this.tatumService.generateAddress(wallet.xpub, 0);
    await this.prisma.user.update({
      where: { issuer },
      data: { xpub: wallet.xpub, addresses: [address] },
    });
    return wallet;
  }

  async getWalletBalance(issuer: string) {
    const user = await this.prisma.user.findFirst({ where: { issuer } });
    const balance = await this.tatumService.getBalance(user.addresses[0]);
    return balance;
  }
}
