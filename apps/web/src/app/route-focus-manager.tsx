import { useEffect, type PropsWithChildren } from 'react';
import { useLocation, useNavigation } from 'react-router';

function focusPrimaryHeading(): boolean {
  const heading = document.querySelector<HTMLElement>('h1');

  if (!heading) {
    return false;
  }

  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  return true;
}

function RouteFocusManager() {
  const location = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state !== 'idle') {
      return;
    }

    if (focusPrimaryHeading()) {
      return;
    }

    const root = document.getElementById('root');

    if (!root) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (focusPrimaryHeading()) {
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location.pathname, navigation.state]);

  return null;
}

function AppRouteRoot({ children }: PropsWithChildren) {
  return (
    <>
      <RouteFocusManager />
      {children}
    </>
  );
}

export { AppRouteRoot, RouteFocusManager };
