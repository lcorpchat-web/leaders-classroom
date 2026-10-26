// Données de démonstration pour le développement local (npm run db:seed).
// Reprend le scénario du critère de réception : un administrateur, un enseignant, des apprenants,
// une classe, une affectation, des inscriptions et une séance programmée.
// Idempotent : peut être relancé sans créer de doublons.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, StatutInscription } from '../src/generated/prisma/client.js';

const MOT_DE_PASSE_DEMO = 'Leaders2026!';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const motDePasseHache = await bcrypt.hash(MOT_DE_PASSE_DEMO, 12);

  const comptes = [
    { nom: 'Admin', prenom: 'Leaders', email: 'admin@leaders-classroom.local', role: Role.ADMIN },
    {
      nom: 'Mbuye', prenom: 'Paul', email: 'paul.mbuye@leaders-classroom.local', role: Role.ENSEIGNANT,
      specialite: 'Gestion de projet',
    },
    {
      nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@leaders-classroom.local', role: Role.APPRENANT,
      matricule: 'LC-2026-0001',
    },
    {
      nom: 'Kouamé', prenom: 'Samuel', email: 'samuel.kouame@leaders-classroom.local', role: Role.APPRENANT,
      matricule: 'LC-2026-0002',
    },
  ];

  const [admin, enseignant, apprenant1, apprenant2] = await Promise.all(
    comptes.map((c) =>
      prisma.utilisateur.upsert({
        where: { email: c.email },
        update: {},
        create: { ...c, motDePasseHache },
      }),
    ),
  );

  let classe = await prisma.classe.findFirst({ where: { nom: 'Gestion de projet - Session 1' } });
  classe ??= await prisma.classe.create({
    data: {
      nom: 'Gestion de projet - Session 1',
      description: 'Planification, suivi et pilotage de projet',
      dateDebut: new Date('2026-10-01'),
      capaciteMax: 30,
    },
  });

  await prisma.affectation.upsert({
    where: { classeId_enseignantId: { classeId: classe.id, enseignantId: enseignant!.id } },
    update: {},
    create: { classeId: classe.id, enseignantId: enseignant!.id },
  });

  for (const apprenant of [apprenant1!, apprenant2!]) {
    await prisma.inscription.upsert({
      where: { classeId_apprenantId: { classeId: classe.id, apprenantId: apprenant.id } },
      update: {},
      create: { classeId: classe.id, apprenantId: apprenant.id, statut: StatutInscription.VALIDEE },
    });
  }

  if ((await prisma.seance.count({ where: { classeId: classe.id } })) === 0) {
    const demain = new Date();
    demain.setUTCDate(demain.getUTCDate() + 1);
    demain.setUTCHours(9, 0, 0, 0);

    await prisma.seance.create({
      data: {
        classeId: classe.id,
        enseignantId: enseignant!.id,
        titre: 'Séance 1 - Cadrage du projet',
        debut: demain,
        dureeMinutes: 120,
      },
    });
  }

  console.log('Données de démonstration prêtes.');
  console.log(`Comptes (mot de passe : ${MOT_DE_PASSE_DEMO}) :`);
  for (const u of [admin!, enseignant!, apprenant1!, apprenant2!]) {
    console.log(`  - ${u.role.padEnd(10)} ${u.email}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
