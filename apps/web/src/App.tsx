import { BriefcaseBusiness, Search } from 'lucide-react';
import { Brand } from '@/components/shared/brand';
import { MobileShell } from '@/components/shared/mobile-shell';
import { RoleOption } from '@/components/shared/role-option';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <MobileShell>
      <main className="safe-area-top flex flex-1 flex-col px-5 pb-6">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <Badge variant="secondary">Simples de usar</Badge>
        </div>

        <div className="relative mt-10">
          <span
            aria-hidden="true"
            className="absolute -top-5 -left-5 h-18 w-2 rounded-r-full bg-accent"
          />
          <p className="mb-2 text-base font-bold text-primary">Seu próximo serviço começa aqui</p>
          <h1 className="max-w-80 text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.035em]">
            Trabalho perto de você.
          </h1>
          <p className="mt-4 max-w-90 text-lg leading-relaxed text-muted-foreground">
            Encontre uma oportunidade ou contrate alguém de confiança, sem complicação.
          </p>
        </div>

        <section aria-labelledby="role-heading" className="mt-9">
          <h2 className="mb-3 text-base font-extrabold" id="role-heading">
            O que você quer fazer?
          </h2>
          <div className="space-y-3">
            <RoleOption
              description="Quero encontrar trabalho"
              href="/cadastro?tipo=trabalhador"
              icon={Search}
              title="Buscar um serviço"
            />
            <RoleOption
              description="Quero encontrar um profissional"
              href="/cadastro?tipo=contratante"
              icon={BriefcaseBusiness}
              title="Contratar alguém"
              tone="accent"
            />
          </div>
        </section>

        <div className="mt-auto flex flex-col items-center gap-1 pt-9 text-center">
          <span className="text-base text-muted-foreground">Já tem uma conta?</span>
          <Button asChild variant="link">
            <a href="/entrar">Entrar no TrampoFácil</a>
          </Button>
        </div>
      </main>
    </MobileShell>
  );
}

export { App };
