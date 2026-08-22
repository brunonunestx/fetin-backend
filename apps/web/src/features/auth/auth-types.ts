type UserType = 'local_owner' | 'operator';

type AuthUser = {
  type: UserType;
  userId: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = LoginInput & {
  type: UserType;
};

const homeRouteByUserType: Record<UserType, string> = {
  local_owner: '/painel',
  operator: '/trabalhos',
};

export { homeRouteByUserType };
export type { AuthUser, LoginInput, RegisterInput, UserType };
