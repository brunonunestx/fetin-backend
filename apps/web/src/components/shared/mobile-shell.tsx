import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MobileShellProps = ComponentProps<'div'> & {
  bottomNavigation?: ReactNode;
};

function MobileShell({ children, className, bottomNavigation, ...props }: MobileShellProps) {
  return (
    <div className="min-h-dvh bg-background sm:bg-[#e8eeea]">
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-hidden bg-background sm:shadow-[0_0_40px_rgb(29_41_38/0.12)]',
          className,
        )}
        {...props}
      >
        {children}
        {bottomNavigation}
      </div>
    </div>
  );
}

export { MobileShell };
