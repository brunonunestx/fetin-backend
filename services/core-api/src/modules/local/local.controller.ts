import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { Local } from '../../generated/prisma/client';
import { CreateLocalDto } from './dto/create-local.dto';
import { LocalService } from './local.service';

@Controller('locals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocalController {
  constructor(private readonly localService: LocalService) {}

  @Post()
  @Roles('local_owner')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateLocalDto,
  ): Promise<Local> {
    return this.localService.create(request.user.userId, body);
  }

  @Get()
  @Roles('local_owner')
  async findAll(@Req() request: AuthenticatedRequest): Promise<Local[]> {
    return this.localService.findAllByOwner(request.user.userId);
  }

  @Get(':id')
  @Roles('local_owner')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Local> {
    return this.localService.findById(id, request.user.userId);
  }
}
