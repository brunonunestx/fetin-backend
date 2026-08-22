import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('App', () => {
  it('offers clear entry paths for both roles', async () => {
    renderApp('/boas-vindas');

    expect(
      await screen.findByRole('heading', { name: 'Trabalho perto de você.' }),
    ).toBeInTheDocument();
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
