import { PrismaClient, AssignmentType, ImmeubleStatus, ProspectingMode, PorteStatut } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Managers ---
  const manager1 = await prisma.manager.upsert({
    where: { email: 'jean.dupont@example.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      telephone: '0123456789',
    },
  });
  console.log(`Created manager: ${manager1.prenom} ${manager1.nom}`);

  const manager2 = await prisma.manager.upsert({
    where: { email: 'marie.curie@example.com' },
    update: {},
    create: {
      nom: 'Curie',
      prenom: 'Marie',
      email: 'marie.curie@example.com',
      telephone: '0987654321',
    },
  });
  console.log(`Created manager: ${manager2.prenom} ${manager2.nom}`);

  // --- Equipes ---
  const equipeAlpha = await prisma.equipe.upsert({
    where: { nom_managerId: { nom: 'Équipe Alpha', managerId: manager1.id } },
    update: {},
    create: {
      nom: 'Équipe Alpha',
      managerId: manager1.id,
    },
  });
  console.log(`Created equipe: ${equipeAlpha.nom}`);

  const equipeBeta = await prisma.equipe.upsert({
    where: { nom_managerId: { nom: 'Équipe Beta', managerId: manager1.id } },
    update: {},
    create: {
      nom: 'Équipe Beta',
      managerId: manager1.id,
    },
  });
  console.log(`Created equipe: ${equipeBeta.nom}`);

  const equipeGamma = await prisma.equipe.upsert({
    where: { nom_managerId: { nom: 'Équipe Gamma', managerId: manager2.id } },
    update: {},
    create: {
      nom: 'Équipe Gamma',
      managerId: manager2.id,
    },
  });
  console.log(`Created equipe: ${equipeGamma.nom}`);

  // --- Commerciaux ---
  const commercialAlice = await prisma.commercial.upsert({
    where: { email: 'alice.martin@example.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Alice',
      email: 'alice.martin@example.com',
      equipeId: equipeAlpha.id,
      managerId: manager1.id,
    },
  });
  console.log(`Created commercial: ${commercialAlice.prenom} ${commercialAlice.nom}`);

  const commercialBob = await prisma.commercial.upsert({
    where: { email: 'bob.durand@example.com' },
    update: {},
    create: {
      nom: 'Durand',
      prenom: 'Bob',
      email: 'bob.durand@example.com',
      equipeId: equipeAlpha.id,
      managerId: manager1.id,
    },
  });
  console.log(`Created commercial: ${commercialBob.prenom} ${commercialBob.nom}`);

  const commercialCharlie = await prisma.commercial.upsert({
    where: { email: 'charlie.leblanc@example.com' },
    update: {},
    create: {
      nom: 'Leblanc',
      prenom: 'Charlie',
      email: 'charlie.leblanc@example.com',
      equipeId: equipeBeta.id,
      managerId: manager1.id,
    },
  });
  console.log(`Created commercial: ${commercialCharlie.prenom} ${commercialCharlie.nom}`);

  const commercialDiana = await prisma.commercial.upsert({
    where: { email: 'diana.rousseau@example.com' },
    update: {},
    create: {
      nom: 'Rousseau',
      prenom: 'Diana',
      email: 'diana.rousseau@example.com',
      equipeId: equipeGamma.id,
      managerId: manager2.id,
    },
  });
  console.log(`Created commercial: ${commercialDiana.prenom} ${commercialDiana.nom}`);

  // --- Zones ---
  const zoneCentreVille = await prisma.zone.upsert({
    where: { nom_typeAssignation: { nom: 'Zone Centre-Ville', typeAssignation: AssignmentType.EQUIPE } },
    update: {},
    create: {
      nom: 'Zone Centre-Ville',
      latitude: 45.764043,
      longitude: 4.835659,
      rayonMetres: 1500,
      couleur: '#FF5733',
      typeAssignation: AssignmentType.EQUIPE,
      equipeId: equipeAlpha.id,
    },
  });
  console.log(`Created zone: ${zoneCentreVille.nom}`);

  const zonePeripherieNord = await prisma.zone.upsert({
    where: { nom_typeAssignation: { nom: 'Zone Périphérie Nord', typeAssignation: AssignmentType.EQUIPE } },
    update: {},
    create: {
      nom: 'Zone Périphérie Nord',
      latitude: 45.800000,
      longitude: 4.850000,
      rayonMetres: 2000,
      couleur: '#33FF57',
      typeAssignation: AssignmentType.EQUIPE,
      equipeId: equipeBeta.id,
    },
  });
  console.log(`Created zone: ${zonePeripherieNord.nom}`);

  const zoneSudEst = await prisma.zone.upsert({
    where: { nom_typeAssignation: { nom: 'Zone Sud-Est', typeAssignation: AssignmentType.EQUIPE } },
    update: {},
    create: {
      nom: 'Zone Sud-Est',
      latitude: 45.700000,
      longitude: 4.900000,
      rayonMetres: 1800,
      couleur: '#5733FF',
      typeAssignation: AssignmentType.EQUIPE,
      equipeId: equipeGamma.id,
    },
  });
  console.log(`Created zone: ${zoneSudEst.nom}`);

  // --- Immeubles ---
  const immeuble1 = await prisma.immeuble.create({
    data: {
      adresse: '123 Rue de la République',
      ville: 'Lyon',
      codePostal: '69002',
      status: ImmeubleStatus.A_VISITER,
      nbPortesTotal: 5,
      prospectingMode: ProspectingMode.SOLO,
      zoneId: zoneCentreVille.id,
      latitude: 45.763,
      longitude: 4.834,
      hasElevator: true,
      digicode: '12A34',
      prospectors: {
        connect: { id: commercialAlice.id },
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
      nbPortesTotal: 8,
      prospectingMode: ProspectingMode.DUO,
      zoneId: zoneCentreVille.id,
      latitude: 45.749,
      longitude: 4.872,
      hasElevator: false,
      prospectors: {
        connect: [{ id: commercialAlice.id }, { id: commercialBob.id }],
      },
    },
  });
  console.log(`Created immeuble: ${immeuble2.adresse}`);

  const immeuble3 = await prisma.immeuble.create({
    data: {
      adresse: '789 Boulevard de la Croix-Rousse',
      ville: 'Lyon',
      codePostal: '69004',
      status: ImmeubleStatus.A_VISITER,
      nbPortesTotal: 10,
      prospectingMode: ProspectingMode.SOLO,
      zoneId: zonePeripherieNord.id,
      latitude: 45.778,
      longitude: 4.828,
      hasElevator: true,
      digicode: 'B45C',
      prospectors: {
        connect: { id: commercialCharlie.id },
      },
    },
  });
  console.log(`Created immeuble: ${immeuble3.adresse}`);

  const immeuble4 = await prisma.immeuble.create({
    data: {
      adresse: '101 Rue Garibaldi',
      ville: 'Lyon',
      codePostal: '69003',
      status: ImmeubleStatus.A_VISITER,
      nbPortesTotal: 6,
      prospectingMode: ProspectingMode.DUO,
      zoneId: zoneSudEst.id,
      latitude: 45.758,
      longitude: 4.858,
      hasElevator: false,
      prospectors: {
        connect: [{ id: commercialDiana.id }, { id: commercialBob.id }], // Bob peut aussi travailler dans cette zone
      },
    },
  });
  console.log(`Created immeuble: ${immeuble4.adresse}`);

  // --- Portes for Immeubles ---
  const portesImmeuble1 = Array.from({ length: immeuble1.nbPortesTotal }, (_, i) => ({
    numeroPorte: `Porte ${101 + i}`,
    statut: PorteStatut.NON_VISITE,
    passage: 0,
    immeubleId: immeuble1.id,
  }));
  await prisma.porte.createMany({ data: portesImmeuble1, skipDuplicates: true });
  console.log(`Created ${immeuble1.nbPortesTotal} portes for immeuble ${immeuble1.adresse}`);

  const portesImmeuble2 = Array.from({ length: immeuble2.nbPortesTotal }, (_, i) => ({
    numeroPorte: `Apt ${'A'.charCodeAt(0) + i}`,
    statut: PorteStatut.NON_VISITE,
    passage: 0,
    immeubleId: immeuble2.id,
  }));
  await prisma.porte.createMany({ data: portesImmeuble2, skipDuplicates: true });
  console.log(`Created ${immeuble2.nbPortesTotal} portes for immeuble ${immeuble2.adresse}`);

  const portesImmeuble3 = Array.from({ length: immeuble3.nbPortesTotal }, (_, i) => ({
    numeroPorte: `Appt ${201 + i}`,
    statut: PorteStatut.NON_VISITE,
    passage: 0,
    immeubleId: immeuble3.id,
  }));
  await prisma.porte.createMany({ data: portesImmeuble3, skipDuplicates: true });
  console.log(`Created ${immeuble3.nbPortesTotal} portes for immeuble ${immeuble3.adresse}`);

  const portesImmeuble4 = Array.from({ length: immeuble4.nbPortesTotal }, (_, i) => ({
    numeroPorte: `Lot ${1 + i}`,
    statut: PorteStatut.NON_VISITE,
    passage: 0,
    immeubleId: immeuble4.id,
  }));
  await prisma.porte.createMany({ data: portesImmeuble4, skipDuplicates: true });
  console.log(`Created ${immeuble4.nbPortesTotal} portes for immeuble ${immeuble4.adresse}`);

  // --- HistoriqueProspection ---
  const historiqueEntries = [
    // Alice - Immeuble 1
    {
      dateProspection: new Date('2024-06-01T10:00:00Z'),
      commercialId: commercialAlice.id,
      immeubleId: immeuble1.id,
      nbPortesVisitees: 3, nbContratsSignes: 1, nbRdvPris: 1, nbRefus: 0, nbAbsents: 1,
      commentaire: 'Première visite, 1 contrat.',
    },
    {
      dateProspection: new Date('2024-06-05T14:30:00Z'),
      commercialId: commercialAlice.id,
      immeubleId: immeuble1.id,
      nbPortesVisitees: 2, nbContratsSignes: 0, nbRdvPris: 1, nbRefus: 1, nbAbsents: 0,
      commentaire: 'Suivi, 1 RDV pris.',
    },
    // Bob - Immeuble 2
    {
      dateProspection: new Date('2024-06-02T11:00:00Z'),
      commercialId: commercialBob.id,
      immeubleId: immeuble2.id,
      nbPortesVisitees: 4, nbContratsSignes: 2, nbRdvPris: 0, nbRefus: 1, nbAbsents: 1,
      commentaire: 'Bonne journée, 2 contrats.',
    },
    {
      dateProspection: new Date('2024-06-06T09:00:00Z'),
      commercialId: commercialBob.id,
      immeubleId: immeuble2.id,
      nbPortesVisitees: 3, nbContratsSignes: 0, nbRdvPris: 0, nbRefus: 2, nbAbsents: 1,
      commentaire: 'Difficile, beaucoup de refus.',
    },
    // Charlie - Immeuble 3
    {
      dateProspection: new Date('2024-06-03T13:00:00Z'),
      commercialId: commercialCharlie.id,
      immeubleId: immeuble3.id,
      nbPortesVisitees: 5, nbContratsSignes: 1, nbRdvPris: 2, nbRefus: 1, nbAbsents: 1,
      commentaire: 'Nouveau secteur, 1 contrat et 2 RDV.',
    },
    {
      dateProspection: new Date('2024-06-07T10:00:00Z'),
      commercialId: commercialCharlie.id,
      immeubleId: immeuble3.id,
      nbPortesVisitees: 4, nbContratsSignes: 0, nbRdvPris: 1, nbRefus: 1, nbAbsents: 2,
      commentaire: 'Quelques absents.',
    },
    // Diana - Immeuble 4
    {
      dateProspection: new Date('2024-06-04T15:00:00Z'),
      commercialId: commercialDiana.id,
      immeubleId: immeuble4.id,
      nbPortesVisitees: 3, nbContratsSignes: 1, nbRdvPris: 0, nbRefus: 0, nbAbsents: 2,
      commentaire: 'Bonne prise de contact.',
    },
    {
      dateProspection: new Date('2024-06-08T11:00:00Z'),
      commercialId: commercialDiana.id,
      immeubleId: immeuble4.id,
      nbPortesVisitees: 2, nbContratsSignes: 0, nbRdvPris: 0, nbRefus: 1, nbAbsents: 1,
      commentaire: 'Peu de succès aujourd\'hui.',
    },
    // Plus de données pour Alice et Bob
    {
      dateProspection: new Date('2024-06-10T09:30:00Z'),
      commercialId: commercialAlice.id,
      immeubleId: immeuble1.id,
      nbPortesVisitees: 4, nbContratsSignes: 2, nbRdvPris: 0, nbRefus: 1, nbAbsents: 1,
      commentaire: 'Deux contrats de plus !',
    },
    {
      dateProspection: new Date('2024-06-12T16:00:00Z'),
      commercialId: commercialBob.id,
      immeubleId: immeuble2.id,
      nbPortesVisitees: 5, nbContratsSignes: 1, nbRdvPris: 1, nbRefus: 1, nbAbsents: 2,
      commentaire: 'Un contrat et un RDV.',
    },
    {
      dateProspection: new Date('2024-06-15T10:00:00Z'),
      commercialId: commercialCharlie.id,
      immeubleId: immeuble3.id,
      nbPortesVisitees: 6, nbContratsSignes: 0, nbRdvPris: 3, nbRefus: 2, nbAbsents: 1,
      commentaire: 'Beaucoup de RDV pris.',
    },
    {
      dateProspection: new Date('2024-06-18T14:00:00Z'),
      commercialId: commercialDiana.id,
      immeubleId: immeuble4.id,
      nbPortesVisitees: 4, nbContratsSignes: 1, nbRdvPris: 0, nbRefus: 1, nbAbsents: 2,
      commentaire: 'Un contrat inattendu.',
    },
    {
      dateProspection: new Date('2024-06-20T11:00:00Z'),
      commercialId: commercialAlice.id,
      immeubleId: immeuble1.id,
      nbPortesVisitees: 3, nbContratsSignes: 0, nbRdvPris: 0, nbRefus: 2, nbAbsents: 1,
      commentaire: 'Journée calme.',
    },
    {
      dateProspection: new Date('2024-06-22T13:00:00Z'),
      commercialId: commercialBob.id,
      immeubleId: immeuble2.id,
      nbPortesVisitees: 6, nbContratsSignes: 3, nbRdvPris: 0, nbRefus: 1, nbAbsents: 2,
      commentaire: 'Très productive !',
    },
    {
      dateProspection: new Date('2024-06-25T09:00:00Z'),
      commercialId: commercialCharlie.id,
      immeubleId: immeuble3.id,
      nbPortesVisitees: 5, nbContratsSignes: 1, nbRdvPris: 1, nbRefus: 1, nbAbsents: 2,
      commentaire: 'Un contrat et un RDV.',
    },
    {
      dateProspection: new Date('2024-06-28T10:00:00Z'),
      commercialId: commercialDiana.id,
      immeubleId: immeuble4.id,
      nbPortesVisitees: 3, nbContratsSignes: 0, nbRdvPris: 0, nbRefus: 2, nbAbsents: 1,
      commentaire: 'Pas de chance.',
    },
  ];

  await prisma.historiqueProspection.createMany({
    data: historiqueEntries,
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