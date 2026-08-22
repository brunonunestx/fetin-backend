import { BriefcaseBusiness, CakeSlice, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { formatPhone } from '@/features/profile/profile-formatters';
import type { PublicProfile, UserProfile } from '@/features/profile/profile-types';

type ProfileSummaryProps = {
  profile: PublicProfile;
  privateDetails?: Pick<UserProfile, 'age' | 'email' | 'phone'>;
};

function ProfileSummary({ privateDetails, profile }: ProfileSummaryProps) {
  const roleLabel = profile.type === 'operator' ? 'Trabalhador' : 'Contratante';

  return (
    <div className="px-5 py-7">
      <section className="flex flex-col items-center text-center">
        <ProfileAvatar name={profile.name} />
        <Badge className="mt-4" variant="secondary">
          {roleLabel}
        </Badge>
        <h2 className="mt-3 text-3xl leading-tight font-extrabold">
          {profile.name ?? 'Perfil sem nome'}
        </h2>
        {profile.type === 'operator' && profile.position ? (
          <p className="mt-2 flex items-center gap-2 text-base font-bold text-primary">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
            {profile.position}
          </p>
        ) : null}
      </section>

      <section className="mt-8 border-t border-border pt-6" aria-labelledby="about-heading">
        <h2 className="text-lg font-extrabold" id="about-heading">
          Sobre
        </h2>
        <p className="mt-2 text-base leading-relaxed whitespace-pre-line text-muted-foreground">
          {profile.bio?.trim() || 'Nenhuma apresentação adicionada ainda.'}
        </p>
      </section>

      {privateDetails ? (
        <section className="mt-7 border-t border-border pt-6" aria-labelledby="contact-heading">
          <h2 className="text-lg font-extrabold" id="contact-heading">
            Seus dados
          </h2>
          <dl className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <dt className="text-sm font-bold text-muted-foreground">E-mail</dt>
                <dd className="text-base break-words">{privateDetails.email}</dd>
              </div>
            </div>
            {privateDetails.phone ? (
              <div className="flex items-start gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <dt className="text-sm font-bold text-muted-foreground">Telefone</dt>
                  <dd className="text-base">{formatPhone(privateDetails.phone)}</dd>
                </div>
              </div>
            ) : null}
            {privateDetails.age !== null ? (
              <div className="flex items-start gap-3">
                <CakeSlice aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <dt className="text-sm font-bold text-muted-foreground">Idade</dt>
                  <dd className="text-base">{privateDetails.age} anos</dd>
                </div>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

export { ProfileSummary };
