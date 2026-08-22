import type { UserType } from '@/features/auth/auth-types';

type UserProfile = {
  age: number | null;
  bio: string | null;
  createdAt: string;
  email: string;
  id: string;
  name: string | null;
  phone: string | null;
  position: string | null;
  type: UserType;
};

type PublicProfile = Pick<UserProfile, 'bio' | 'id' | 'name' | 'position' | 'type'>;

type UpdateProfileInput = {
  age?: number;
  bio?: string;
  name: string;
  phone: string;
  position?: string;
};

function hasText(value: string | null): value is string {
  return Boolean(value?.trim());
}

function isProfileComplete(profile: UserProfile): boolean {
  const hasCommonFields = hasText(profile.name) && hasText(profile.phone);

  return profile.type === 'operator'
    ? hasCommonFields && hasText(profile.position)
    : hasCommonFields;
}

export { isProfileComplete };
export type { PublicProfile, UpdateProfileInput, UserProfile };
