interface LocalSummarySource {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export class LocalSummaryDto {
  id!: string;
  ownerId!: string;
  name!: string;
  address!: string;
  city!: string;
  state!: string;
  zipCode!: string;
}

export function toLocalSummary(local: LocalSummarySource): LocalSummaryDto {
  return {
    id: local.id,
    ownerId: local.ownerId,
    name: local.name,
    address: local.address,
    city: local.city,
    state: local.state,
    zipCode: local.zipCode,
  };
}
