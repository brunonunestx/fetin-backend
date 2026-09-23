import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MobileShellProps = ComponentProps<'div'> & {
  bottomNavigation?: ReactNode;
};

function MobileShell({ children, className, bottomNavigation, ...props }: MobileShellProps) {
  return (
    <div className="min-h-dvh bg-background lg:bg-[#e8eeea] lg:p-4">
      <div
        className={cn(
          'relative mx-auto min-h-dvh w-full bg-background lg:min-h-[calc(100dvh-2rem)] lg:max-w-[90rem] lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-border lg:shadow-[0_18px_60px_rgb(29_41_38/0.12)]',
          bottomNavigation && 'lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]',
          className,
        )}
        {...props}
      >
        <div className="flex min-h-dvh min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:min-h-[calc(100dvh-2rem)]">
          {children}
        </div>
        {bottomNavigation}
      </div>
    </div>
  );
}

export { MobileShell };
