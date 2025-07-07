// frontend-shadcn/src/pages/admin/commerciaux/CommerciauxPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import type { Commercial } from "./commerciaux-table/columns";
import { createColumns } from "./commerciaux-table/columns";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui-admin/button";
import { Input } from "@/components/ui-admin/input";
import { Label } from "@/components/ui-admin/label";
import type { RowSelectionState } from "@tanstack/react-table";
import { Modal } from "@/components/ui-admin/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui-admin/select";
import { commercialService } from "@/services/commercial.service";
import { equipeService } from "@/services/equipe.service";
import { managerService } from "@/services/manager.service";
import type { Manager } from "@/types/types";



const CommerciauxPage = () => {
  const [data, setData] = useState<Commercial[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [itemsToDelete, setItemsToDelete] = useState<Commercial[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const initialFormState = { nom: "", prenom: "", email: "", telephone: "", equipeId: "", managerId: "" };
  const [newCommercialData, setNewCommercialData] = useState(initialFormState);
  const [editingCommercial, setEditingCommercial] = useState<Commercial | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commerciauxFromApi, equipesFromApi, managersFromApi] = await Promise.all([
        commercialService.getCommerciaux(), equipeService.getEquipes(), managerService.getManagers(),
      ]);

      setManagers(managersFromApi);

      const equipesMap = new Map(equipesFromApi.map((e) => [e.id, e.nom] as const));
      const managersMap = new Map(managersFromApi.map((m) => [m.id, `${m.prenom} ${m.nom}`] as const));

      const enrichedCommerciaux: Commercial[] = commerciauxFromApi.map((comm) => {
        const totalContratsSignes = comm.historiques.reduce(
          (sum: number, history: any) => sum + history.nbContratsSignes,
          0,
        );
        return {
          id: comm.id,
          nom: comm.nom,
          prenom: comm.prenom,
          email: comm.email,
          telephone: comm.telephone || '',
          equipeId: comm.equipeId,
          managerId: comm.managerId,
          manager: managersMap.get(comm.managerId) || 'N/A',
          equipe: comm.equipeId ? equipesMap.get(comm.equipeId) || 'Non assignée' : 'Non assignée',
          classement: 0, // Temporary, will be set after sorting
          totalContratsSignes,
        };
      });

      // Sort commercials by totalContratsSignes for ranking
      enrichedCommerciaux.sort(
        (a, b) => {
          const aTotal = commerciauxFromApi.find(c => c.id === a.id)?.historiques.reduce((sum: number, h: any) => sum + h.nbContratsSignes, 0) || 0;
          const bTotal = commerciauxFromApi.find(c => c.id === b.id)?.historiques.reduce((sum: number, h: any) => sum + h.nbContratsSignes, 0) || 0;
          return bTotal - aTotal;
        }
      );

      const rankedCommerciaux = enrichedCommerciaux.map((comm, index) => ({
        ...comm,
        classement: index + 1,
      }));

      setData(rankedCommerciaux);
    } catch (error) { console.error("Erreur lors de la récupération des données:", error); } 
    finally { setLoading(false); }
  };

  const handleEditOpen = (commercial: Commercial) => {
    setEditingCommercial(commercial);
    setIsEditModalOpen(true);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCommercial) return;
    setEditingCommercial({ ...editingCommercial, [e.target.name]: e.target.value });
  };
  
  const handleEditSelectChange = (managerId: string) => {
    if (!editingCommercial) return;
    setEditingCommercial({ ...editingCommercial, managerId });
  };

  const handleUpdateCommercial = async () => {
    if (!editingCommercial) return;
    try {
      const { id, nom, prenom, email, telephone, managerId } = editingCommercial;
      
      const payload = {
        nom, prenom, email, managerId,
        telephone: telephone || undefined,
      };

      await commercialService.updateCommercial(id, payload);

      setIsEditModalOpen(false);
      setEditingCommercial(null);
      fetchData();
    } catch (error) {
      console.error("Erreur de mise à jour du commercial:", error);
    }
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCommercialData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };
  const handleAddCommercial = async () => {
    const { nom, prenom, email, telephone, managerId } = newCommercialData;
    if (!nom || !prenom || !email || !managerId) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      await commercialService.createCommercial({ nom, prenom, email, telephone, managerId });
      setIsAddModalOpen(false);
      setNewCommercialData(initialFormState);
      fetchData();
    } catch (error) {
      console.error("Erreur lors de l'ajout du commercial:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(itemsToDelete.map((c) => commercialService.deleteCommercial(c.id)));
      setItemsToDelete([]);
      setIsDeleteMode(false);
      setRowSelection({});
      fetchData();
    } catch (error) { console.error("Erreur lors de la suppression:", error); }
  };

  const toggleDeleteMode = () => { setIsDeleteMode((prev) => !prev); setRowSelection({}); };
  const handleConfirmDelete = (selectedItems: Commercial[]) => { setItemsToDelete(selectedItems); };

  const columns = useMemo(() => createColumns(isDeleteMode, handleEditOpen), [isDeleteMode]);

  if (loading) {
    return <div>Chargement des commerciaux...</div>;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        title="Gestion des Commerciaux"
        filterColumnId="nom"
        filterPlaceholder="Filtrer par nom de commercial..."
        addEntityButtonText="Ajouter un Commercial"
        onAddEntity={() => setIsAddModalOpen(true)}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={toggleDeleteMode}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onConfirmDelete={handleConfirmDelete}
      />

      <Modal isOpen={itemsToDelete.length > 0} onClose={() => setItemsToDelete([])} title="Confirmer la suppression">
        <h2 className="text-lg font-semibold">Confirmer la suppression</h2>
        <p className="text-sm text-muted-foreground mt-2">Êtes-vous sûr de vouloir supprimer les {itemsToDelete.length} commercial(ux) suivant(s) ?</p>
        <ul className="my-4 list-disc list-inside max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-md">
          {itemsToDelete.map((item) => <li key={item.id}>{item.prenom} {item.nom}</li>)}
        </ul>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setItemsToDelete([])}>Annuler</Button>
          <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleDelete}>Valider</Button>
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un nouveau commercial">
        <h2 className="text-lg font-semibold mb-4">Ajouter un nouveau commercial</h2>
        <div className="grid gap-4">
          <div className="space-y-1"><Label htmlFor="nom">Nom</Label><Input id="nom" placeholder="Nom de famille" value={newCommercialData.nom} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="prenom">Prénom</Label><Input id="prenom" placeholder="Prénom" value={newCommercialData.prenom} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="adresse@email.com" value={newCommercialData.email} onChange={handleAddInputChange} /></div>
          <div className="space-y-1"><Label htmlFor="telephone">Téléphone (optionnel)</Label><Input id="telephone" type="tel" placeholder="0612345678" value={newCommercialData.telephone} onChange={handleAddInputChange} /></div>
          <div className="space-y-1">
            <Label htmlFor="managerId">Manager</Label>
            <Select onValueChange={(value) => setNewCommercialData((prev) => ({ ...prev, managerId: value }))} value={newCommercialData.managerId}>
              <SelectTrigger id="managerId"><SelectValue placeholder="Sélectionner un manager" /></SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>{manager.prenom} {manager.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
          <Button onClick={handleAddCommercial} className="bg-green-600 text-white hover:bg-green-700">Enregistrer</Button>
        </div>
      </Modal>
      
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le commercial">
        <h2 className="text-lg font-semibold mb-4">Modifier le commercial</h2>
        {editingCommercial && (
            <div className="grid gap-4">
            <div className="space-y-1"><Label htmlFor="nom">Nom</Label><Input id="nom" name="nom" value={editingCommercial.nom} onChange={handleEditInputChange} /></div>
            <div className="space-y-1"><Label htmlFor="prenom">Prénom</Label><Input id="prenom" name="prenom" value={editingCommercial.prenom} onChange={handleEditInputChange} /></div>
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={editingCommercial.email} onChange={handleEditInputChange} /></div>
            <div className="space-y-1"><Label htmlFor="telephone">Téléphone</Label><Input id="telephone" name="telephone" type="tel" value={editingCommercial.telephone || ''} onChange={handleEditInputChange} /></div>
            <div className="space-y-1">
                <Label htmlFor="managerId">Manager</Label>
                <Select onValueChange={handleEditSelectChange} value={editingCommercial.managerId}>
                <SelectTrigger id="managerId"><SelectValue placeholder="Sélectionner un manager" /></SelectTrigger>
                <SelectContent>
                    {managers.map((manager) => ( <SelectItem key={manager.id} value={manager.id}>{manager.prenom} {manager.nom}</SelectItem> ))}
                </SelectContent>
                </Select>
            </div>
            </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateCommercial} className="bg-green-600 text-white hover:bg-green-700">Enregistrer les modifications</Button>
        </div>
      </Modal>
    </>
  );
};

export default CommerciauxPage;