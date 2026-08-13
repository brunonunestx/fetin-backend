export enum JobSubscriptionStatus {
  PENDING = 'pending',
  FINISHED = 'finished',
}

export class JobSubscriptionStatusDto {
  status!: JobSubscriptionStatus;
  operatorId!: string;
}
