type WorkLocation = {
  address: string;
  city: string;
  createdAt: string;
  id: string;
  name: string;
  ownerId: string;
  state: string;
  zipCode: string;
};

type CreateLocationInput = Pick<WorkLocation, 'address' | 'city' | 'name' | 'state' | 'zipCode'>;

export type { CreateLocationInput, WorkLocation };
