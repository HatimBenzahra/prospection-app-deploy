# Journal des Modifications

Ce document récapitule les modifications apportées au projet.

## 2025-07-12 - Ajout de la notion d'étage et de portes par étage

### Objectif
Remplacer le champ `nbPortesTotal` par `nbEtages` et `nbPortesParEtage` pour une gestion plus granulaire des immeubles et de la prospection.

### Modifications Backend

*   **Schéma Prisma**:
    *   `backend/prisma/schema.prisma`
        *   Suppression de `nbPortesTotal` du modèle `Immeuble`.
        *   Ajout de `nbEtages` et `nbPortesParEtage` au modèle `Immeuble`.
        *   Ajout de `etage` au modèle `Porte`.
*   **Script de Seed**:
    *   `backend/prisma/seed.ts`
        *   Mise à jour des créations d'immeubles pour utiliser `nbEtages` et `nbPortesParEtage` au lieu de `nbPortesTotal`.
*   **DTOs Immeuble**:
    *   `backend/src/immeuble/dto/create-immeuble.dto.ts`
    *   `backend/src/immeuble/dto/update-immeuble.dto.ts`
    *   `backend/src/immeuble/dto/create-commercial-immeuble.dto.ts`
    *   `backend/src/immeuble/dto/update-commercial-immeuble.dto.ts`
        *   Remplacement de `nbPortesTotal` par `nbEtages` et `nbPortesParEtage`.
*   **Service de Prospection**:
    *   `backend/src/prospection/prospection.service.ts`
        *   Mise à jour de la fonction `generateAndAssignPortes` pour utiliser `nbEtages` et `nbPortesParEtage` pour la génération des portes, et pour assigner le numéro d'étage à chaque porte.
        *   Mise à jour de la fonction `getPendingRequestsForCommercial` pour inclure `nbEtages` et `nbPortesParEtage` dans l'objet `immeuble` retourné, et pour calculer `nbPortesTotal` pour la compatibilité frontend.

### Modifications Frontend

*   **Page des Immeubles Commercial**:
    *   `moduleProspec-1dc4f634c6c14f0913f8052d2523c56f04d7738b/src/pages/commercial/immeubles/CommercialImmeublesPage.tsx`
        *   Mise à jour de l'interface `ImmeubleFormState` pour inclure `nbEtages` et `nbPortesParEtage`.
        *   Adaptation de la logique de `getProspectingStatus` pour calculer le nombre total de portes à partir de `nbEtages` et `nbPortesParEtage`.
        *   Modification de `handleOpenModal` et `handleSubmit` pour gérer les nouveaux champs.
        *   Mise à jour de l'affichage du nombre total de portes dans la carte de l'immeuble.
        *   Modification du formulaire de création/édition pour afficher les champs `Nombre d'étages` et `Portes par étage` au lieu de `Nombre total de portes`.
*   **Service Immeuble Frontend**:
    *   `moduleProspec-1dc4f634c6c14f0913f8052d2523c56f04d7738b/src/services/immeuble.service.ts`
        *   Mise à jour des interfaces `ImmeubleFromApi` et `ImmeubleDetailsFromApi` pour refléter les changements de `nbPortesTotal` en `nbEtages` et `nbPortesParEtage`.
