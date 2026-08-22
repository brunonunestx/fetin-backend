import { render, screen } from '@testing-library/react';
import { BriefcaseBusiness, House, UserRound } from 'lucide-react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BottomNavigation } from '@/components/shared/bottom-navigation';

const items = [
  { href: '/inicio', icon: House, label: 'Início' },
  { href: '/servicos', icon: BriefcaseBusiness, label: 'Serviços' },
  { href: '/perfil', icon: UserRound, label: 'Perfil' },
] as const;

describe('BottomNavigation', () => {
  it('marks the current destination accessibly', () => {
    render(
      <MemoryRouter>
        <BottomNavigation activeHref="/servicos" items={items} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
  });
});
