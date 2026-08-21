import {
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
import { JobSubscriptionStatusDto } from './dto/job-subscription-status.dto';
import { JobSubscriptionService } from './job-subscription.service';

@Controller('jobs')
export class JobSubscriptionController {
  constructor(
    private readonly jobSubscriptionService: JobSubscriptionService,
  ) {}

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('operator')
  async schedule(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.jobSubscriptionService.schedule({
      jobId,
      operatorId: request.user.userId,
    });
  }

  @Get(':id/accepted')
  async getAcceptStatus(
    @Param('id', ParseUUIDPipe) jobId: string,
  ): Promise<JobSubscriptionStatusDto> {
    return this.jobSubscriptionService.getAcceptStatus(jobId);
  }
}
