
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
  console.log(`Created commercial: ${commercial1.prenom} ${commercial1.nom} (ID: ${commercial1.id})`);

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
  console.log(`Created commercial: ${commercial2.prenom} ${commercial2.nom} (ID: ${commercial2.id})`);

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

  // 7. Create HistoriqueProspection
  await prisma.historiqueProspection.createMany({
    data: [
      {
        dateProspection: new Date('2024-06-01T10:00:00Z'),
        commercialId: commercial1.id,
        immeubleId: immeuble1.id,
        nbPortesVisitees: 5,
        nbContratsSignes: 2,
        nbRdvPris: 1,
        nbRefus: 1,
        nbAbsents: 1,
        commentaire: 'Première visite réussie, 2 contrats signés.',
      },
      {
        dateProspection: new Date('2024-06-05T14:30:00Z'),
        commercialId: commercial2.id,
        immeubleId: immeuble2.id,
        nbPortesVisitees: 3,
        nbContratsSignes: 1,
        nbRdvPris: 0,
        nbRefus: 1,
        nbAbsents: 1,
        commentaire: 'Visite en duo, 1 contrat signé.',
      },
      {
        dateProspection: new Date('2024-06-10T09:00:00Z'),
        commercialId: commercial1.id,
        immeubleId: immeuble1.id,
        nbPortesVisitees: 4,
        nbContratsSignes: 0,
        nbRdvPris: 2,
        nbRefus: 1,
        nbAbsents: 1,
        commentaire: 'Prospection intense, 2 RDV pris.',
      },
      {
        dateProspection: new Date('2024-06-15T11:00:00Z'),
        commercialId: commercial1.id,
        immeubleId: immeuble1.id,
        nbPortesVisitees: 6,
        nbContratsSignes: 3,
        nbRdvPris: 0,
        nbRefus: 2,
        nbAbsents: 1,
        commentaire: 'Excellent passage, 3 contrats supplémentaires.',
      },
      {
        dateProspection: new Date('2024-06-20T16:00:00Z'),
        commercialId: commercial2.id,
        immeubleId: immeuble2.id,
        nbPortesVisitees: 4,
        nbContratsSignes: 0,
        nbRdvPris: 1,
        nbRefus: 2,
        nbAbsents: 1,
        commentaire: 'Suivi de RDV, un refus et un absent.',
      },
      {
        dateProspection: new Date('2024-06-25T09:30:00Z'),
        commercialId: commercial1.id,
        immeubleId: immeuble1.id,
        nbPortesVisitees: 5,
        nbContratsSignes: 1,
        nbRdvPris: 0,
        nbRefus: 3,
        nbAbsents: 1,
        commentaire: 'Journée difficile, 1 contrat malgré tout.',
      },
      {
        dateProspection: new Date('2024-07-01T10:00:00Z'),
        commercialId: commercial1.id,
        immeubleId: immeuble1.id,
        nbPortesVisitees: 7,
        nbContratsSignes: 2,
        nbRdvPris: 1,
        nbRefus: 2,
        nbAbsents: 2,
        commentaire: 'Début de mois prometteur, 2 contrats.',
      },
      {
        dateProspection: new Date('2024-07-02T13:00:00Z'),
        commercialId: commercial2.id,
        immeubleId: immeuble2.id,
        nbPortesVisitees: 3,
        nbContratsSignes: 0,
        nbRdvPris: 0,
        nbRefus: 3,
        nbAbsents: 0,
        commentaire: "Pas de succès aujourd'hui.",
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Created historique prospection entries.`);

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
