import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_3px_0_#084c45] hover:bg-[#095f56]',
        accent: 'bg-accent text-accent-foreground shadow-[0_3px_0_#c99c34] hover:bg-[#edbc4d]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_3px_0_#821b13] hover:bg-[#9d2017]',
        outline:
          'border-2 border-input bg-card text-foreground hover:border-primary hover:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-[#dce8e2]',
        ghost: 'text-foreground hover:bg-muted',
        link: 'min-h-11 rounded-md px-1 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12',
        sm: 'h-11 min-h-11 px-4 text-sm',
        lg: 'h-14 min-h-14 px-6 text-lg',
        icon: 'size-12 min-h-12 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export { buttonVariants };
