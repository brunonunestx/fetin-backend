type WorkLocation = {
  address: string;
  city: string;
  createdAt: string;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  ownerId: string;
  state: string;
  zipCode: string;
};

type CreateLocationCoordinates =
  | {
      latitude: number;
      longitude: number;
    }
  | {
      latitude?: never;
      longitude?: never;
    };

type CreateLocationInput = Pick<WorkLocation, 'address' | 'city' | 'name' | 'state' | 'zipCode'> &
  CreateLocationCoordinates;

export type { CreateLocationInput, WorkLocation };
