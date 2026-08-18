import { Type } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { JobSubscriptionModule } from './job-subscription/job-subscription.module';

export const modules: Type[] = [AuthModule, JobSubscriptionModule];
