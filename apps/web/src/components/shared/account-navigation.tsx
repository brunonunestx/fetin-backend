import { BriefcaseBusiness, House, UserRound } from 'lucide-react';
import { BottomNavigation, type NavigationItem } from '@/components/shared/bottom-navigation';
import type { UserType } from '@/features/auth/auth-types';

const navigationByUserType: Record<UserType, readonly NavigationItem[]> = {
  local_owner: [
    { href: '/painel', icon: House, label: 'Início' },
    { href: '/perfil', icon: UserRound, label: 'Perfil' },
  ],
  operator: [
    { href: '/trabalhos', icon: BriefcaseBusiness, label: 'Trabalhos' },
    { href: '/perfil', icon: UserRound, label: 'Perfil' },
  ],
};

function AccountNavigation({ activeHref, type }: { activeHref: string; type: UserType }) {
  return <BottomNavigation activeHref={activeHref} items={navigationByUserType[type]} />;
}

export { AccountNavigation };
