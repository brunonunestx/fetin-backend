import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/features/profile/profile-formatters';
import { cn } from '@/lib/utils';

function ProfileAvatar({ className, name }: { className?: string; name: string | null }) {
  return (
    <Avatar className={cn('size-20 border-2 border-primary/15', className)}>
      <AvatarFallback className="bg-secondary text-2xl font-extrabold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export { ProfileAvatar };
