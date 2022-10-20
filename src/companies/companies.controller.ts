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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Company, Hashtag, Industry, Role } from '@prisma/client';
import { User as UserDecorator } from '../decorators/user.decorator.js';
import { Roles } from '../decorators/role.decorator.js';
import { CompaniesService } from './companies.service.js';
import {
  AddCompanyCardDto,
  CompanyInfoSA,
  CompanyUserInfo,
  CompanyUsersInfo,
  FireUsersDto,
  GetCardsInfo,
  GetCompaniesDto,
  UpdateCompanyCardDto,
  UpdateCompanyInfoDto,
} from './dto/company.dto.js';
import Stripe from 'stripe';
import { RolesGuard } from '../guards/role.guard.js';
import { MagicGuard } from '../auth/magic.guard.js';
import { ActiveGuard } from '../guards/active.guard.js';
import { GetUsersDto } from '../users/dto/user.dto.js';

@Controller('companies')
@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(MagicGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get companies names (SuperAdmin)' })
  @ApiResponse({ status: 200, type: [String] })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.SuperAdmin)
  @Get('names')
  getCompaniesNames(): Promise<string[]> {
    return this.companiesService.getCompaniesNames();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a list of companies (SuperAdmin)' })
  @ApiResponse({ status: 200, type: [Object] })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.SuperAdmin)
  @Get()
  getCompanies(@Query() dto: GetCompaniesDto): Promise<CompanyInfoSA[]> {
    return this.companiesService.getCompanies(dto.page);
  }

  @ApiOperation({ summary: 'Get company info (Admin & SuperAdmin)' })
  @ApiResponse({ status: 200, type: Object })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get(':id')
  getCompany(
    @Param('id') id: string,
    @UserDecorator() user,
  ): Promise<Company | CompanyInfoSA> {
    return this.companiesService.getCompany(user.issuer, id);
  }

  @ApiOperation({ summary: 'Get a list of industries' })
  @ApiResponse({ status: 200, type: [Object] })
  @Get('industries')
  getIndustries(): Promise<Industry[]> {
    return this.companiesService.getIndustries();
  }

  @ApiOperation({ summary: 'Get list of company users (Admin)' })
  @ApiResponse({ status: 200, type: [Object] })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Get('users')
  getCompanyUsers(
    @UserDecorator() user,
    @Query() dto: GetUsersDto,
  ): Promise<CompanyUsersInfo[]> {
    return this.companiesService.getCompanyUsers(user.issuer, dto.page);
  }

  @ApiOperation({ summary: 'Get user in company (Admin)' })
  @ApiResponse({ status: 200, type: [Object] })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Get('users/:id')
  getCompanyUser(
    @UserDecorator() user,
    @Param('id') id: string,
  ): Promise<CompanyUserInfo> {
    return this.companiesService.getCompanyUser(user.issuer, id);
  }

  @ApiOperation({ summary: 'Update company info (Admin)' })
  @ApiResponse({ status: 200, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Put()
  updateCompanyInfo(
    @UserDecorator() user,
    @Body() dto: UpdateCompanyInfoDto,
  ): Promise<string> {
    return this.companiesService.updateCompanyInfo(user.issuer, dto);
  }

  @ApiOperation({ summary: 'Fire users (Admin)' })
  @ApiResponse({ status: 200, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Put('fire')
  fireUsers(@UserDecorator() user, @Body() dto: FireUsersDto): Promise<string> {
    return this.companiesService.fireUsers(user.issuer, dto);
  }

  @ApiOperation({ summary: 'Get a list of hashtags' })
  @ApiResponse({ status: 200, type: [Object] })
  @Get('/hashtags')
  getHashtags(): Promise<Hashtag[]> {
    return this.companiesService.getHashtags();
  }

  @ApiOperation({ summary: 'Create hashtag' })
  @ApiResponse({ status: 201, type: Object })
  @Post('/hashtags')
  createHashtag(@Query('value') value: string): Promise<Hashtag> {
    return this.companiesService.createHashtag(value);
  }

  @ApiOperation({ summary: 'Get cards details (Admin)' })
  @ApiResponse({
    status: 201,
    type: Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>>,
  })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Get('cards')
  getCardsDetails(@UserDecorator() user): Promise<GetCardsInfo[] | string> {
    return this.companiesService.getCardsDetails(user.issuer);
  }

  @ApiOperation({ summary: 'Add company card (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Post('cards')
  addCard(
    @UserDecorator() user,
    @Body() dto: AddCompanyCardDto,
  ): Promise<string> {
    return this.companiesService.addCard(user.issuer, dto);
  }

  @ApiOperation({ summary: 'Update company card info (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Put('cards/:id')
  updateCard(
    @UserDecorator() user,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyCardDto,
  ): Promise<string> {
    return this.companiesService.updateCard(user.issuer, id, dto);
  }

  @ApiOperation({ summary: 'Make company card default (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Put('cards/default/:id')
  makeCardDefault(
    @UserDecorator() user,
    @Param('id') id: string,
  ): Promise<string> {
    return this.companiesService.makeCardDefault(user.issuer, id);
  }

  @ApiOperation({ summary: 'Delete company card (Admin)' })
  @ApiResponse({ status: 201, type: String })
  @UseGuards(RolesGuard, ActiveGuard)
  @Roles(Role.Admin)
  @Delete('cards/:id')
  deleteCard(@UserDecorator() user, @Param('id') id: string): Promise<string> {
    return this.companiesService.deleteCard(user.issuer, id);
  }
}
