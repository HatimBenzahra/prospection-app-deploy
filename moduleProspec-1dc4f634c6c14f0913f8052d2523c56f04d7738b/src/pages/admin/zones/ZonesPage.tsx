// frontend-shadcn/src/pages/admin/zones/ZonesPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { ZoneMap } from './ZoneMap';
import { Button } from '@/components/ui-admin/button';
import { DataTable } from '@/components/data-table/DataTable';
import { createZoneColumns, type Zone as ZoneTableType } from './columns';
import { Modal } from '@/components/ui-admin/Modal';
import { ZoneCreatorModal } from './ZoneCreatorModal';
import type { RowSelectionState } from '@tanstack/react-table';
import { zoneService } from '@/services/zone.service';
import { AssignmentType } from '@/types/enums';
import L from 'leaflet';
import { ViewToggleContainer } from '@/components/ui-admin/ViewToggleContainer';

const ZonesPage = () => {
  const [view, setView] = useState<'table' | 'map'>('table');
  const [existingZones, setExistingZones] = useState<ZoneTableType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneTableType | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [itemsToDelete, setItemsToDelete] = useState<ZoneTableType[]>([]);
  const [zoneToFocusId, setZoneToFocusId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zones] = await Promise.all([
        zoneService.getZones(),
      ]);

      const formattedZones: ZoneTableType[] = zones.map(z => ({
        id: z.id,
        name: z.nom,
        assignedTo: 'Non assignée', // Plus d'assignation directe ici
        color: z.couleur || 'gray',
        latlng: [z.latitude, z.longitude],
        radius: z.rayonMetres,
        dateCreation: z.createdAt,
      }));

      setExistingZones(formattedZones);
    } catch (error) {
      console.error('Erreur de chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (zone: ZoneTableType) => {
    setEditingZone(zone);
    setIsCreatorOpen(true);
  };

  const handleCloseCreator = () => {
    setIsCreatorOpen(false);
    setEditingZone(null);
  };

  const handleZoneValidated = async (data: {
    id?: string;
    center: L.LatLng;
    radius: number;
    name: string;
    color: string;
  }) => {
    const payload: any = {
      nom: data.name,
      latitude: data.center.lat,
      longitude: data.center.lng,
      rayonMetres: data.radius,
      couleur: data.color,
      typeAssignation: AssignmentType.EQUIPE, // Valeur par défaut, car l'assignation est gérée ailleurs
    };

    try {
      if (data.id) {
        await zoneService.updateZone(data.id, payload);
      } else {
        await zoneService.createZone(payload);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la zone:', error);
    }

    handleCloseCreator();
    fetchData();
  };

  const handleConfirmDelete = (selectedRows: ZoneTableType[]) => setItemsToDelete(selectedRows);
  const handleDelete = async () => {
    try {
      await Promise.all(itemsToDelete.map(z => zoneService.deleteZone(z.id)));
      setItemsToDelete([]);
      setIsDeleteMode(false);
      setRowSelection({});
      fetchData();
    } catch (error) {
      console.error('Erreur de suppression:', error);
    }
  };

  // MODIFICATION : C'est la fonction qui gère le clic sur une ligne
  const handleRowClick = (zone: ZoneTableType) => {
    setZoneToFocusId(zone.id); // On définit la zone à cibler
    setView('map'); // Et on bascule sur la carte
  };

  // MODIFICATION : C'est la fonction qui gère le changement de vue via les boutons
  const handleViewChange = (newView: 'table' | 'map') => {
    if (newView === 'map') {
      // Si on bascule sur la carte, on s'assure qu'aucune zone n'est ciblée
      setZoneToFocusId(null); 
    }
    setView(newView);
  };

  const handleClearFocus = () => setZoneToFocusId(null);
  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setRowSelection({});
  };
  const zoneColumns = useMemo(() => createZoneColumns(isDeleteMode, handleEditClick), [isDeleteMode]);

  if (loading) return <div>Chargement...</div>;

  const tableComponent = (
    <DataTable
        noCardWrapper
        columns={zoneColumns}
        data={existingZones}
        title=""
        filterColumnId="name"
        filterPlaceholder="Rechercher une zone par son nom..."
        addEntityButtonText="Ajouter une Zone"
        onAddEntity={() => {
          setEditingZone(null);
          setIsCreatorOpen(true);
        }}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={toggleDeleteMode}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onConfirmDelete={handleConfirmDelete}
        onRowClick={handleRowClick} // Ce prop est bien utilisé pour cibler une zone
      />
  );
  
  const mapComponent = (
     <ZoneMap
        existingZones={existingZones}
        onAddZoneClick={() => {
          setEditingZone(null);
          setIsCreatorOpen(true);
        }}
        zoneToFocus={zoneToFocusId}
        onFocusClear={handleClearFocus}
      />
  );

  return (
    <div className="h-full flex flex-col gap-6">
      {isCreatorOpen && (
        <ZoneCreatorModal
          onValidate={handleZoneValidated}
          onClose={handleCloseCreator}
          existingZones={existingZones}
          zoneToEdit={editingZone}
        />
      )}
      <Modal
        isOpen={itemsToDelete.length > 0}
        onClose={() => setItemsToDelete([])}
        title="Confirmer la suppression"
      >
        <p className="text-sm text-muted-foreground mt-2">
          Êtes-vous sûr de vouloir supprimer les {itemsToDelete.length} zone(s) sélectionnée(s)
          ?
        </p>
        <ul className="my-4 list-disc list-inside max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-md">
          {itemsToDelete.map(item => (<li key={item.id}>{item.name}</li>))}
        </ul>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setItemsToDelete([])}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Valider la suppression</Button>
        </div>
      </Modal>

      <ViewToggleContainer
        title="Gestion des Zones"
        description="Basculez entre la vue tableau et la vue carte interactive pour créer, modifier et visualiser les zones."
        view={view}
        onViewChange={handleViewChange} // MODIFICATION: Utilisation de la nouvelle fonction de gestion
        tableComponent={tableComponent}
        mapComponent={mapComponent}
      />
    </div>
  );
};

export default ZonesPage;