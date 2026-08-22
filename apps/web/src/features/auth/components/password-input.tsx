import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'>>(
  function PasswordInput(props, ref) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <Input className="pr-14" ref={ref} type={isVisible ? 'text' : 'password'} {...props} />
        <Button
          aria-label={isVisible ? 'Esconder senha' : 'Mostrar senha'}
          className="absolute top-0 right-0 text-muted-foreground"
          onClick={() => setIsVisible((current) => !current)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    );
  },
);

export { PasswordInput };
