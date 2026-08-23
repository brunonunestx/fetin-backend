import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionGuard } from '@/features/pwa/components/connection-guard';
import { PwaInstallCard } from '@/features/pwa/components/pwa-install-card';
import { PwaUpdateBanner } from '@/features/pwa/components/pwa-update-banner';
import { PwaInstallContext } from '@/features/pwa/pwa-install-context';
import { PwaInstallProvider } from '@/features/pwa/pwa-install-provider';
import { isIosDevice, isStandaloneApp } from '@/features/pwa/pwa-install-rules';

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
}

describe('PWA experience', () => {
  afterEach(() => {
    setOnline(true);
  });

  it('recognizes iPhones, touch-enabled iPads and standalone mode', () => {
    expect(
      isIosDevice({ maxTouchPoints: 5, platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone)' }),
    ).toBe(true);
    expect(
      isIosDevice({
        maxTouchPoints: 5,
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh)',
      }),
    ).toBe(true);
    expect(
      isIosDevice({
        maxTouchPoints: 5,
        platform: 'Linux armv8l',
        userAgent: 'Mozilla/5.0 Android',
      }),
    ).toBe(false);
    expect(isStandaloneApp(true, false)).toBe(true);
    expect(isStandaloneApp(false, true)).toBe(true);
  });

  it('uses the captured Android native install prompt', async () => {
    const user = userEvent.setup();
    const prompt = vi.fn(() => Promise.resolve());
    const installEvent = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperties(installEvent, {
      prompt: { value: prompt },
      userChoice: {
        value: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      },
    });
    render(
      <PwaInstallProvider>
        <PwaInstallCard />
      </PwaInstallProvider>,
    );

    act(() => {
      window.dispatchEvent(installEvent);
    });
    await user.click(await screen.findByRole('button', { name: 'Instalar aplicativo' }));

    expect(installEvent.defaultPrevented).toBe(true);
    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('region', { name: 'Instalar aplicativo' })).not.toBeInTheDocument();
  });

  it('shows the manual Share to Home Screen instructions for iPhone', async () => {
    const user = userEvent.setup();
    render(
      <PwaInstallContext.Provider
        value={{ installMode: 'ios', requestInstall: () => Promise.resolve('unavailable') }}
      >
        <PwaInstallCard />
      </PwaInstallContext.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ver como instalar no iPhone' }));

    expect(await screen.findByRole('heading', { name: 'Instalar no iPhone' })).toBeVisible();
    expect(screen.getByText('Compartilhar → Adicionar à Tela de Início')).toBeVisible();
  });

  it('keeps the current form mounted while the connection is absent', async () => {
    const user = userEvent.setup();
    setOnline(true);
    render(
      <ConnectionGuard>
        <label>
          Nome
          <input />
        </label>
      </ConnectionGuard>,
    );
    const input = screen.getByLabelText('Nome');
    await user.type(input, 'Maria');

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('heading', { name: 'Você está sem internet' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByText('Ainda não encontramos uma conexão.')).toBeVisible();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(
      screen.queryByRole('heading', { name: 'Você está sem internet' }),
    ).not.toBeInTheDocument();
    expect(input).toHaveValue('Maria');
  });

  it('offers an update without replacing the active form', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onUpdate = vi.fn();
    render(
      <>
        <label>
          Descrição
          <input />
        </label>
        <PwaUpdateBanner isUpdating={false} onDismiss={onDismiss} onUpdate={onUpdate} />
      </>,
    );
    const input = screen.getByLabelText('Descrição');
    await user.type(input, 'Dados ainda aqui');

    expect(screen.getByText('Atualização disponível')).toBeVisible();
    expect(input).toHaveValue('Dados ainda aqui');
    await user.click(screen.getByRole('button', { name: 'Depois' }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(input).toHaveValue('Dados ainda aqui');
  });
});
