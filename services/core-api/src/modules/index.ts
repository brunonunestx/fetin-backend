import { Type } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { JobSubscriptionModule } from './job-subscription/job-subscription.module';
import { LocalModule } from './local/local.module';
import { ProfileModule } from './profile/profile.module';

export const modules: Type[] = [
  AuthModule,
  JobSubscriptionModule,
  LocalModule,
  ProfileModule,
];
