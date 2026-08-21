import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AcceptedJobDto } from './dto/accepted-job.dto';
import { JobSubscriptionService } from './job-subscription.service';

@Controller('me')
export class MeController {
  constructor(
    private readonly jobSubscriptionService: JobSubscriptionService,
  ) {}

  @Get('accepted-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('operator')
  async getAcceptedJobs(
    @Req() request: AuthenticatedRequest,
  ): Promise<AcceptedJobDto[]> {
    return this.jobSubscriptionService.findAcceptedByOperator(
      request.user.userId,
    );
  }
}
