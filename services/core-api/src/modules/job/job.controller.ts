import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { Job } from '../../generated/prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import { FindJobsDto } from './dto/find-jobs.dto';
import { JobListItemDto } from './dto/job-list-item.dto';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('local_owner')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateJobDto,
  ): Promise<Job> {
    return this.jobService.create(request.user.userId, body);
  }

  @Get()
  async findAll(@Query() query: FindJobsDto): Promise<JobListItemDto[]> {
    return this.jobService.findAll(query.localId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return this.jobService.findById(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('local_owner')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Job> {
    return this.jobService.cancel(request.user.userId, id);
  }
}
