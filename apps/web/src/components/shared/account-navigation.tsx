import { BriefcaseBusiness, CalendarClock, House, MapPinned, UserRound } from 'lucide-react';
import { BottomNavigation, type NavigationItem } from '@/components/shared/bottom-navigation';
import type { UserType } from '@/features/auth/auth-types';

const navigationByUserType: Record<UserType, readonly NavigationItem[]> = {
  local_owner: [
    { href: '/painel', icon: House, label: 'Início' },
    { href: '/locais', icon: MapPinned, label: 'Locais' },
    { href: '/perfil', icon: UserRound, label: 'Perfil' },
  ],
  operator: [
    { href: '/trabalhos', icon: BriefcaseBusiness, label: 'Trabalhos' },
    { href: '/historico', icon: CalendarClock, label: 'Histórico' },
    { href: '/perfil', icon: UserRound, label: 'Perfil' },
  ],
};

function AccountNavigation({
  activeHref,
  desktopOnly = false,
  type,
}: {
  activeHref: string;
  desktopOnly?: boolean;
  type: UserType;
}) {
  return (
    <BottomNavigation
      activeHref={activeHref}
      desktopOnly={desktopOnly}
      items={navigationByUserType[type]}
    />
  );
}

export { AccountNavigation };
