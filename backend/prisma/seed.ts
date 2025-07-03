
import { PrismaClient, AssignmentType, ImmeubleStatus, ProspectingMode, PorteStatut } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // 1. Create Manager
  const manager = await prisma.manager.upsert({
    where: { email: 'jean.dupont@example.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      telephone: '0123456789',
    },
  });
  console.log(`Created manager: ${manager.prenom} ${manager.nom}`);

  // 2. Create Equipe
  const equipe = await prisma.equipe.upsert({
    where: { nom_managerId: { nom: 'Équipe Alpha', managerId: manager.id } },
    update: {},
    create: {
      nom: 'Équipe Alpha',
      managerId: manager.id,
    },
  });
  console.log(`Created equipe: ${equipe.nom}`);

  // 3. Create Commerciaux
  const commercial1 = await prisma.commercial.upsert({
    where: { email: 'alice.martin@example.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Alice',
      email: 'alice.martin@example.com',
      equipeId: equipe.id,
      managerId: manager.id,
    },
  });
  console.log(`Created commercial: ${commercial1.prenom} ${commercial1.nom}`);

  const commercial2 = await prisma.commercial.upsert({
    where: { email: 'bob.durand@example.com' },
    update: {},
    create: {
      nom: 'Durand',
      prenom: 'Bob',
      email: 'bob.durand@example.com',
      equipeId: equipe.id,
      managerId: manager.id,
    },
  });
  console.log(`Created commercial: ${commercial2.prenom} ${commercial2.nom}`);

  // 4. Create Zone
  const zone = await prisma.zone.upsert({
    where: { nom_typeAssignation: { nom: 'Zone Centre-Ville', typeAssignation: AssignmentType.EQUIPE } },
    update: {},
    create: {
      nom: 'Zone Centre-Ville',
      latitude: 45.764043,
      longitude: 4.835659,
      rayonMetres: 1500,
      couleur: '#FF5733',
      typeAssignation: AssignmentType.EQUIPE,
      equipeId: equipe.id,
    },
  });
  console.log(`Created zone: ${zone.nom}`);

  // 5. Create Immeubles
  const immeuble1 = await prisma.immeuble.create({
    data: {
      adresse: '123 Rue de la République',
      ville: 'Lyon',
      codePostal: '69002',
      status: ImmeubleStatus.A_VISITER,
      nbPortesTotal: 3,
      prospectingMode: ProspectingMode.SOLO,
      zoneId: zone.id,
      latitude: 45.763,
      longitude: 4.834,
      hasElevator: true,
      digicode: '12A34',
      prospectors: {
        connect: { id: commercial1.id },
      },
    },
  });
  console.log(`Created immeuble: ${immeuble1.adresse}`);

  const immeuble2 = await prisma.immeuble.create({
    data: {
      adresse: '456 Avenue des Frères Lumière',
      ville: 'Lyon',
      codePostal: '69008',
      status: ImmeubleStatus.A_VISITER,
      nbPortesTotal: 2,
      prospectingMode: ProspectingMode.DUO,
      zoneId: zone.id,
      latitude: 45.749,
      longitude: 4.872,
      hasElevator: false,
      prospectors: {
        connect: [{ id: commercial1.id }, { id: commercial2.id }],
      },
    },
  });
  console.log(`Created immeuble: ${immeuble2.adresse}`);

  // 6. Create Portes for Immeubles
  await prisma.porte.createMany({
    data: [
      { numeroPorte: 'Porte 101', statut: PorteStatut.NON_VISITE, passage: 0, immeubleId: immeuble1.id },
      { numeroPorte: 'Porte 102', statut: PorteStatut.NON_VISITE, passage: 0, immeubleId: immeuble1.id },
      { numeroPorte: 'Porte 103', statut: PorteStatut.NON_VISITE, passage: 0, immeubleId: immeuble1.id },
    ],
    skipDuplicates: true,
  });
  console.log(`Created 3 portes for immeuble ${immeuble1.adresse}`);

  await prisma.porte.createMany({
    data: [
      { numeroPorte: 'Apt A', statut: PorteStatut.NON_VISITE, passage: 0, immeubleId: immeuble2.id },
      { numeroPorte: 'Apt B', statut: PorteStatut.NON_VISITE, passage: 0, immeubleId: immeuble2.id },
    ],
    skipDuplicates: true,
  });
  console.log(`Created 2 portes for immeuble ${immeuble2.adresse}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
