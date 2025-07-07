// frontend-shadcn/src/pages/admin/Managers/ManagersPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import type { Manager } from "./managers-table/columns";
import { getColumns } from "./managers-table/columns";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui-admin/button";
import { Input } from "@/components/ui-admin/input";
import { Label } from "@/components/ui-admin/label";
import { type RowSelectionState } from "@tanstack/react-table";
import { Modal } from "@/components/ui-admin/Modal";
import { managerService } from "@/services/manager.service";

const ManagersPage = () => {
  const [data, setData] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [managersToDelete, setManagersToDelete] = useState<Manager[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const initialFormState = { nom: '', prenom: '', email: '', telephone: '' };
  const [newManagerData, setNewManagerData] = useState(initialFormState);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const managers = await managerService.getManagers();
      const formattedManagers = managers.map((m) => {
        const nbEquipes = m.equipes.length;
        const totalContratsSignes = m.equipes.reduce((accEquipe: number, equipe: any) => {
          return (
            accEquipe +
            equipe.commerciaux.reduce((accCommercial: number, commercial: any) => {
              return (
                accCommercial +
                commercial.historiques.reduce((accHistory: number, history: any) => {
                  return accHistory + history.nbContratsSignes;
                }, 0)
              );
            }, 0)
          );
        }, 0);

        return {
          ...m,
          telephone: m.telephone || '',
          nbEquipes: nbEquipes,
          totalContratsSignes: totalContratsSignes,
        };
      });

      // Sort managers by totalContratsSignes for ranking
      formattedManagers.sort((a, b) => b.totalContratsSignes - a.totalContratsSignes);

      const rankedManagers = formattedManagers.map((m, index) => ({
        ...m,
        classement: index + 1,
      }));

      setData(rankedManagers);
    } catch (error) {
      console.error("Erreur lors de la récupération des managers:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE D'ÉDITION ---
  const handleEditOpen = (manager: Manager) => {
    setEditingManager(manager);
    setIsEditModalOpen(true);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingManager) return;
    setEditingManager({ ...editingManager, [e.target.id]: e.target.value });
  };
  
  const handleUpdateManager = async () => {
    if (!editingManager) return;
    try {
      const { id, nom, prenom, email, telephone } = editingManager;
      const payload = { nom, prenom, email, telephone: telephone || undefined };
      await managerService.updateManager(id, payload);
      setIsEditModalOpen(false);
      setEditingManager(null);
      fetchManagers();
    } catch (error) {
      console.error("Erreur de mise à jour du manager:", error);
    }
  };

  // --- LOGIQUE D'AJOUT ---
  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewManagerData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleAddManager = async () => {
    if (!newManagerData.nom || !newManagerData.prenom || !newManagerData.email) {
        alert("Les champs Nom, Prénom et Email sont obligatoires.");
        return;
    }
    try {
      await managerService.createManager(newManagerData);
      setIsAddModalOpen(false);
      setNewManagerData(initialFormState);
      fetchManagers();
    } catch (error) {
      console.error("Erreur lors de l'ajout du manager:", error);
    }
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleDelete = async () => {
    try {
      await Promise.all(managersToDelete.map(m => managerService.deleteManager(m.id)));
      setManagersToDelete([]);
      setIsDeleteMode(false);
      setRowSelection({});
      fetchManagers();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };
  
  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
    setRowSelection({});
  };

  const handleConfirmDelete = (selectedManagers: Manager[]) => {
    setManagersToDelete(selectedManagers);
  };
  
  const columns = useMemo(() => getColumns(isDeleteMode, handleEditOpen), [isDeleteMode]);

  if (loading) {
      return <div>Chargement des managers...</div>;
  }

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        title="Gestion des Managers"
        filterColumnId="nom"
        filterPlaceholder="Filtrer par nom de manager..."
        addEntityButtonText="Ajouter un Manager"
        onAddEntity={() => setIsAddModalOpen(true)}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={toggleDeleteMode}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onConfirmDelete={handleConfirmDelete}
      />

      <Modal
        isOpen={managersToDelete.length > 0}
        onClose={() => setManagersToDelete([])}
        title="Confirmer la suppression"
      >
        <p className="text-sm text-muted-foreground mt-2">Êtes-vous sûr de vouloir supprimer les {managersToDelete.length} manager(s) suivant(s) ?</p>
        <ul className="my-4 list-disc list-inside max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-md">
          {managersToDelete.map(m => <li key={m.id}>{m.prenom} {m.nom}</li>)}
        </ul>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setManagersToDelete([])}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Valider</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un nouveau manager"
      >
        <div className="grid gap-4">
          <div className="space-y-1"><Label htmlFor="nom">Nom</Label><Input id="nom" placeholder="Dupont" value={newManagerData.nom} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="prenom">Prénom</Label><Input id="prenom" placeholder="Jean" value={newManagerData.prenom} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="jean.dupont@example.com" value={newManagerData.email} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="telephone">Téléphone</Label><Input id="telephone" type="tel" placeholder="0612345678" value={newManagerData.telephone} onChange={handleAddInputChange} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
          <Button onClick={handleAddManager} className="bg-green-600 text-white hover:bg-green-700">Enregistrer</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le manager"
      >
        {editingManager && (
            <div className="grid gap-4">
                <div className="space-y-1"><Label htmlFor="nom">Nom</Label><Input id="nom" value={editingManager.nom} onChange={handleEditInputChange} /></div>
                <div className="space-y-1"><Label htmlFor="prenom">Prénom</Label><Input id="prenom" value={editingManager.prenom} onChange={handleEditInputChange} /></div>
                <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editingManager.email} onChange={handleEditInputChange} /></div>
                <div className="space-y-1"><Label htmlFor="telephone">Téléphone</Label><Input id="telephone" type="tel" value={editingManager.telephone || ''} onChange={handleEditInputChange} /></div>
            </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateManager} className="bg-green-600 text-white hover:bg-green-700">Enregistrer les modifications</Button>
        </div>
      </Modal>
    </>
  )
}

export default ManagersPage;