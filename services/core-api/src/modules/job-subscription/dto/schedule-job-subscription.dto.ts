import { IsUUID } from 'class-validator';

export class ScheduleJobSubscriptionDto {
  @IsUUID()
  operatorId: string;
}
