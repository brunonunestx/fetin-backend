import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { Local, PrismaClient, User, UserType } from '../../src/generated/prisma/client';

const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'Seed@12345';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const OWNERS = [
  {
    email: 'contratante.churrascaria@seed.trampofacil.com',
    name: 'Churrascaria Boi na Brasa',
  },
  {
    email: 'contratante.buffet@seed.trampofacil.com',
    name: 'Buffet Sabor & Arte',
  },
] as const;

const LOCALS = [
  {
    ownerEmail: OWNERS[0].email,
    name: 'Churrascaria Boi na Brasa',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
  {
    ownerEmail: OWNERS[0].email,
    name: 'Espaço Villa Eventos',
    address: 'Rua Augusta, 500',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01305-000',
  },
  {
    ownerEmail: OWNERS[1].email,
    name: 'Buffet Sabor & Arte',
    address: 'Rua das Flores, 250',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22041-001',
  },
] as const;

const JOB_TEMPLATES = [
  {
    title: 'Garçom para evento corporativo',
    description: 'Atendimento de mesa e bandeja em evento corporativo, uniforme social.',
    durationMinutes: 300,
    value: 180.0,
  },
  {
    title: 'Cozinheiro para churrasco',
    description: 'Preparo e ponto de carnes na brasa para evento de até 150 convidados.',
    durationMinutes: 420,
    value: 260.0,
  },
  {
    title: 'Auxiliar de cozinha',
    description: 'Apoio no pré-preparo e organização da cozinha durante o evento.',
    durationMinutes: 360,
    value: 150.0,
  },
  {
    title: 'Barman para festa de casamento',
    description: 'Montagem de open bar e preparo de drinks autorais para 200 convidados.',
    durationMinutes: 360,
    value: 220.0,
  },
  {
    title: 'Recepcionista de evento',
    description: 'Recepção e credenciamento de convidados na entrada do evento.',
    durationMinutes: 240,
    value: 130.0,
  },
  {
    title: 'Segurança para evento corporativo',
    description: 'Controle de acesso e rondas durante evento corporativo noturno.',
    durationMinutes: 480,
    value: 210.0,
  },
  {
    title: 'Montador de estrutura de palco',
    description: 'Montagem e desmontagem de palco e tablado para show ao vivo.',
    durationMinutes: 300,
    value: 240.0,
  },
  {
    title: 'Diarista para limpeza pós-evento',
    description: 'Limpeza geral do espaço após o término do evento.',
    durationMinutes: 240,
    value: 140.0,
  },
  {
    title: 'Manobrista',
    description: 'Manobra e guarda de veículos de convidados durante o evento.',
    durationMinutes: 360,
    value: 160.0,
  },
  {
    title: 'DJ para festa de aniversário',
    description: 'Set completo de 4 horas com equipamento próprio de som.',
    durationMinutes: 240,
    value: 400.0,
  },
  {
    title: 'Cozinheira para bufê de casamento',
    description: 'Produção de pratos quentes e frios para bufê de casamento.',
    durationMinutes: 480,
    value: 300.0,
  },
  {
    title: 'Auxiliar de bar',
    description: 'Apoio na reposição de gelo, insumos e organização do bar.',
    durationMinutes: 300,
    value: 145.0,
  },
] as const;

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function seedOwners(): Promise<User[]> {
  const owners: User[] = [];

  for (const owner of OWNERS) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: owner.email },
      update: {},
      create: {
        email: owner.email,
        passwordHash,
        type: UserType.local_owner,
        name: owner.name,
      },
    });

    owners.push(user);
  }

  return owners;
}

async function resetSeedLocals(ownerIds: string[]) {
  const existingLocals = await prisma.local.findMany({
    where: { ownerId: { in: ownerIds } },
    select: { id: true },
  });
  const existingLocalIds = existingLocals.map((local) => local.id);

  if (existingLocalIds.length > 0) {
    await prisma.job.deleteMany({ where: { localId: { in: existingLocalIds } } });
    await prisma.local.deleteMany({ where: { id: { in: existingLocalIds } } });
  }
}

async function seedLocals(ownersByEmail: Map<string, string>): Promise<Local[]> {
  const locals: Local[] = [];

  for (const local of LOCALS) {
    const ownerId = ownersByEmail.get(local.ownerEmail);
    if (!ownerId) continue;

    const created = await prisma.local.create({
      data: {
        ownerId,
        name: local.name,
        address: local.address,
        city: local.city,
        state: local.state,
        zipCode: local.zipCode,
      },
    });

    locals.push(created);
  }

  return locals;
}

async function seedJobs(localIds: string[]) {
  const jobs = JOB_TEMPLATES.map((template, index) => ({
    localId: localIds[index % localIds.length],
    title: template.title,
    description: template.description,
    startsAt: hoursFromNow(24 * (index % 15) + 6),
    durationMinutes: template.durationMinutes,
    value: template.value,
  }));

  await prisma.job.createMany({ data: jobs });

  return jobs.length;
}

async function main() {
  const owners = await seedOwners();
  const ownerIds = owners.map((owner) => owner.id);
  const ownersByEmail = new Map(owners.map((owner) => [owner.email, owner.id]));

  await resetSeedLocals(ownerIds);
  const locals = await seedLocals(ownersByEmail);
  const jobsCreated = await seedJobs(locals.map((local) => local.id));

  console.log(`Seed concluída: ${owners.length} donos, ${locals.length} locais, ${jobsCreated} vagas.`);
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao rodar a seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
