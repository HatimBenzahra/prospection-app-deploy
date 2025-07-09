import React, { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui-admin/button";
import { Input } from "@/components/ui-admin/input";
import { Label } from "@/components/ui-admin/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui-admin/dialog";
import { Checkbox } from "@/components/ui-admin/checkbox";
import { toast } from 'sonner';
import type { RowSelectionState } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { immeubleService, type ImmeubleFormData } from "@/services/immeuble.service";
import { createImmeublesColumns, type ImmeubleCommercial } from './columns';

const ImmeublesPage = () => {
  const [data, setData] = useState<ImmeubleCommercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImmeuble, setEditingImmeuble] = useState<ImmeubleCommercial | null>(null);
  const [formData, setFormData] = useState<ImmeubleFormData>({
    adresse: '', ville: '', codePostal: '', nbPortesTotal: 0, nom: '', hasElevator: false, digicode: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const immeublesFromApi = await immeubleService.getMyImmeubles();
      setData(immeublesFromApi);
    } catch (error) {
      toast.error("Erreur lors de la récupération de vos immeubles.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingImmeuble(null);
    setFormData({ adresse: '', ville: 'Lyon', codePostal: '6900', nbPortesTotal: 10, nom: '', hasElevator: false, digicode: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (immeuble: ImmeubleCommercial) => {
    setEditingImmeuble(immeuble);
    setFormData({
      adresse: immeuble.adresse,
      nom: immeuble.nom || '',
      // Vous devrez peut-être récupérer ces infos de l'API si elles ne sont pas dans la table
      ville: 'Lyon',
      codePostal: '69000',
      nbPortesTotal: 10, // Exemple, à récupérer de l'API
      hasElevator: false,
      digicode: '',
    });
    setIsModalOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    try {
      if (editingImmeuble) {
        await immeubleService.updateMyImmeuble(editingImmeuble.id, formData);
        toast.success("Immeuble mis à jour avec succès !");
      } else {
        await immeubleService.createMyImmeuble(formData);
        toast.success("Immeuble ajouté avec succès !");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Échec de l'opération.");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    const itemsToDelete = Object.keys(rowSelection);
    if (itemsToDelete.length === 0) return;
    
    toast.promise(Promise.all(itemsToDelete.map(id => immeubleService.deleteMyImmeuble(data[parseInt(id)].id))), {
      loading: 'Suppression en cours...',
      success: () => {
        setIsDeleteMode(false);
        setRowSelection({});
        fetchData();
        return `${itemsToDelete.length} immeuble(s) supprimé(s).`;
      },
      error: 'Erreur lors de la suppression.',
    });
  };

  const toggleDeleteMode = () => { setIsDeleteMode(prev => !prev); setRowSelection({}); };
  
  const columns = useMemo(() => createImmeublesColumns(isDeleteMode, openEditModal), [isDeleteMode]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary"/>
            Mes Immeubles
          </h1>
          <p className="text-muted-foreground">Gérez les immeubles qui vous sont assignés.</p>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        title=""
        filterColumnId="adresse"
        filterPlaceholder="Rechercher par adresse..."
        addEntityButtonText="Ajouter un Immeuble"
        onAddEntity={openAddModal}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={toggleDeleteMode}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onConfirmDelete={handleDelete}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingImmeuble ? "Modifier l'immeuble" : "Ajouter un immeuble"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right sm:text-left">Nom/Réf.</Label>
              <Input id="nom" value={formData.nom} onChange={handleInputChange} className="col-span-3" placeholder="Ex: Résidence Le Parc"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="adresse" className="text-right sm:text-left">Adresse</Label>
              <Input id="adresse" value={formData.adresse} onChange={handleInputChange} className="col-span-3" required />
            </div>
            {/* Ajoutez les autres champs ici : ville, codePostal, nbPortesTotal, etc. */}
             <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="nbPortesTotal" className="text-right sm:text-left">Portes</Label>
              <Input id="nbPortesTotal" type="number" value={formData.nbPortesTotal} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="digicode" className="text-right sm:text-left">Digicode</Label>
              <Input id="digicode" value={formData.digicode} onChange={handleInputChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
               <Label htmlFor="hasElevator" className="text-right sm:text-left">Ascenseur</Label>
              <Checkbox id="hasElevator" checked={formData.hasElevator} onCheckedChange={(checked) => setFormData(p => ({...p, hasElevator: checked as boolean}))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Annuler</Button></DialogClose>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImmeublesPage;
