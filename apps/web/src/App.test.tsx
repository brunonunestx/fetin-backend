import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';

describe('App', () => {
  it('offers clear entry paths for both roles', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Trabalho perto de você.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buscar um serviço/ })).toHaveAttribute(
      'href',
      '/cadastro?tipo=trabalhador',
    );
    expect(screen.getByRole('link', { name: /Contratar alguém/ })).toHaveAttribute(
      'href',
      '/cadastro?tipo=contratante',
    );
    expect(screen.getByRole('link', { name: 'Entrar no TrampoFácil' })).toHaveAttribute(
      'href',
      '/entrar',
    );
  });
});
