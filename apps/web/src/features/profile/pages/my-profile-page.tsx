import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ProfileSummary } from '@/features/profile/components/profile-summary';

function MyProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { logout, profile, user } = useAuth();

  if (!profile || !user) {
    return null;
  }

  return (
    <MobileShell>
      <PageHeader
        action={
          isEditing ? null : (
            <Button onClick={() => setIsEditing(true)} type="button" variant="ghost">
              <Pencil aria-hidden="true" />
              Editar
            </Button>
          )
        }
        title={isEditing ? 'Editar perfil' : 'Meu perfil'}
      />

      <main className="flex-1">
        {isEditing ? (
          <div className="px-5 py-7">
            <ProfileForm
              onCancel={() => setIsEditing(false)}
              onSaved={() => setIsEditing(false)}
              profile={profile}
              submitLabel="Salvar alterações"
              type={user.type}
            />
          </div>
        ) : (
          <>
            <ProfileSummary
              privateDetails={{
                age: user.type === 'operator' ? profile.age : null,
                email: profile.email,
                phone: profile.phone,
              }}
              profile={profile}
            />
            <div className="px-5 pb-8">
              <Button className="w-full" onClick={logout} type="button" variant="outline">
                Sair da conta
              </Button>
            </div>
          </>
        )}
      </main>

      <AccountNavigation activeHref="/perfil" type={user.type} />
    </MobileShell>
  );
}

export { MyProfilePage };
