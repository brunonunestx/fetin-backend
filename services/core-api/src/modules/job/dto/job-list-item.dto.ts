import { Job } from '../../../generated/prisma/client';

export type JobListItemDto = Job & { filled: boolean };
