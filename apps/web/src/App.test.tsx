import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';

describe('App', () => {
  it('presents the product name and purpose', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'TrampoFácil' })).toBeInTheDocument();
    expect(screen.getByText('Trabalho perto de você.')).toBeInTheDocument();
  });
});
