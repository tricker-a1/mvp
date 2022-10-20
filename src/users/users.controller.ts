import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../decorators/role.decorator.js';
import {
  AddUserCardDto,
  UpdateUserCardDto,
  CreateSuperAdminDto,
  InviteAdminsDto,
  InviteEmployeesDto,
  RegisterAdminDto,
  RegisterEmployeeDto,
  CreateWalletDto,
  SetUserPermissions,
  ChangeUserRole,
  GetCardsInfo,
  UpdateMyProfileDto,
  UsersInfoSA,
  UserInfoSA,
  GetUsersDto,
  CompleteEmployeeRegistrationDto,
  CompleteAdminRegistrationDto,
} from './dto/user.dto.js';
import { UsersService } from './users.service.js';
import { UploadGuard } from '../guards/upload.guard.js';
import { CSVFile } from '../decorators/csv-file.decorator.js';
import { MagicGuard } from '../auth/magic.guard.js';
import { RolesGuard } from '../guards/role.guard.js';
import { User as UserDecorator } from '../decorators/user.decorator.js';
import { ActiveGuard } from '../guards/active.guard.js';
import Stripe from 'stripe';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(MagicGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile' })
  @ApiResponse({ status: 200, type: [Object] })
  @UseGuards(ActiveGuard)
  @Get('profile')
  async getMy(@UserDecorator() user) {
    return this.usersService.getMy(user.issuer);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a list of users (SuperAdmin)' })
  @ApiResponse({ status: 200, type: [Object] })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  @Get()
  getAllUsers(@Query() dto: GetUsersDto): Promise<UsersInfoSA[]> {
    return this.usersService.getAllUsers(dto.page);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new wallet or add exists [Step two of registration]',
  })
  @Post('wallet')
  getWallet(@UserDecorator() user, @Body() dto: CreateWalletDto) {
    return this.usersService.createWallet(user.issuer, dto?.mnemonic);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet balance' })
  @UseGuards(ActiveGuard)
  @Get('wallet')
  getWalletBalance(@UserDecorator() user) {
    return this.usersService.getWalletBalance(user.issuer);
  }

  @ApiOperation({ summary: 'Get user info (SuperAdmin)' })
  @ApiResponse({ status: 200, type: Object })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  @Get(':id')
  getUser(@Param('id') id: string): Promise<UserInfoSA> {
    return this.usersService.getUser(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add user info [Step one of registration]' })
  @ApiResponse({ status: 201, type: Object })
  @ApiExtraModels(RegisterEmployeeDto, RegisterAdminDto)
  @ApiBody({
    schema: {
      oneOf: [
        {
          $ref: getSchemaPath(RegisterEmployeeDto),
        },
        {
          $ref: getSchemaPath(RegisterAdminDto),
        },
      ],
    },
  })
  @Put('register')
  registerUser(
    @Body() dto: RegisterEmployeeDto | RegisterAdminDto,
    @UserDecorator() user,
  ) {
    return this.usersService.registerUser(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add user (company) info [Step three of registration]',
  })
  @ApiResponse({ status: 201, type: Object })
  @ApiExtraModels(CompleteEmployeeRegistrationDto, CompleteAdminRegistrationDto)
  @ApiBody({
    schema: {
      oneOf: [
        {
          $ref: getSchemaPath(CompleteAdminRegistrationDto),
        },
        {
          $ref: getSchemaPath(CompleteEmployeeRegistrationDto),
        },
      ],
    },
  })
  @Put('completeRegistration')
  completeUserRegistration(
    @Body() dto: CompleteEmployeeRegistrationDto | CompleteAdminRegistrationDto,
    @UserDecorator() user,
  ) {
    return this.usersService.completeUserRegistration(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create super admin' })
  @ApiResponse({ status: 201, type: Object })
  @Post('superAdmin')
  createSuperAdmin(
    @Body() dto: CreateSuperAdminDto,
    @UserDecorator() user,
  ): Promise<User> {
    return this.usersService.createSuperAdmin(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile info' })
  @ApiResponse({ status: 200, type: String })
  @UseGuards(ActiveGuard)
  @Put('profile')
  updateMyProfile(
    @UserDecorator() user,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<string> {
    return this.usersService.updateMyProfile(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user role (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Admin)
  @Put('role')
  changeUserRole(
    @UserDecorator() user,
    @Body() dto: ChangeUserRole,
  ): Promise<string> {
    return this.usersService.changeUserRole(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set user permissions (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Put('permissions')
  setUserPermissions(
    @UserDecorator() user,
    @Body() dto: SetUserPermissions,
  ): Promise<string> {
    return this.usersService.setUserPermissions(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, type: String })
  @Delete()
  deleteUser(@UserDecorator() user): Promise<string> {
    return this.usersService.deleteUser(user.issuer);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send invites to employees (Admin)' })
  @ApiResponse({ status: 200, type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        emails: {
          type: 'array' || null,
          nullable: true,
        },
      },
    },
  })
  @UseGuards(ActiveGuard, UploadGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('employee/invite')
  async inviteUsers(
    @Body() dto: InviteEmployeesDto,
    @CSVFile() file,
    @UserDecorator() user,
  ) {
    return this.usersService.inviteUsers(file, user.issuer, dto.emails);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send invites to admins (SuperAdmin)' })
  @ApiResponse({ status: 200, type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        emails: {
          type: 'array' || null,
          nullable: true,
        },
      },
    },
  })
  @UseGuards(UploadGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  @Post('admin/invite')
  inviteAdmins(@Body() dto: InviteAdminsDto, @CSVFile() file): Promise<string> {
    return this.usersService.inviteAdmins(file, dto.emails);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cards details' })
  @ApiResponse({
    status: 201,
    type: Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>>,
  })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  @Get('cards')
  getCardsDetails(@UserDecorator() user): Promise<GetCardsInfo[] | string> {
    return this.usersService.getCardsDetails(user.issuer);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add card' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  @Post('cards')
  addCard(@UserDecorator() user, @Body() dto: AddUserCardDto): Promise<string> {
    return this.usersService.addCard(user.issuer, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update card info' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  @Put('cards/:id')
  updateCard(
    @UserDecorator() user,
    @Param('id') id: string,
    @Body() dto: UpdateUserCardDto,
  ): Promise<string> {
    return this.usersService.updateCard(user.issuer, id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make card default' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  @Put('cards/default/:id')
  makeCardDefault(
    @UserDecorator() user,
    @Param('id') id: string,
  ): Promise<string> {
    return this.usersService.makeCardDefault(user.issuer, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete card' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(ActiveGuard, RolesGuard)
  @Roles(Role.Employee, Role.Admin, Role.SuperAdmin)
  @Delete('cards/:id')
  deleteCard(@UserDecorator() user, @Param('id') id: string): Promise<string> {
    return this.usersService.deleteCard(user.issuer, id);
  }
}
