import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { immeubleService, type ImmeubleFromApi } from '../../../services/immeuble.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { Button } from '../../../components/ui-admin/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui-admin/dialog';
import AddressInput from '@/components/ui-admin/AddressInput';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Input } from '../../../components/ui-admin/input';
import { Checkbox } from '../../../components/ui-admin/checkbox';
import { Label } from '../../../components/ui-admin/label';
import { Loader2, PlusCircle, Building, Trash2, Edit, Search, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui-admin/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ImmeubleFormState = {
  adresse: string;
  ville: string;
  codePostal: string;
  nbEtages: number;
  nbPortesParEtage: number;
  hasElevator: boolean;
  digicode?: string;
  latitude?: number;
  longitude?: number;
};

const buildingStatusMap: { [key: string]: { label: string; className: string } } = {
    NON_CONFIGURE: { label: "Non configuré", className: "bg-gray-200 text-gray-700" },
    NON_COMMENCE: { label: "À commencer", className: "bg-yellow-100 text-yellow-800" },
    EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-800" },
    COMPLET: { label: "Complet", className: "bg-green-100 text-green-800" },
};

const PageSkeleton = () => (
    <div className="space-y-8 animate-pulse p-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
        </div>
    </div>
);

const CommercialImmeublesPage: React.FC = () => {
  const { user } = useAuth();
  const [immeubles, setImmeubles] = useState<ImmeubleFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingImmeuble, setEditingImmeuble] = useState<ImmeubleFromApi | null>(null);
  const [formState, setFormState] = useState<ImmeubleFormState>({} as ImmeubleFormState);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchImmeubles = useCallback(async () => {
    if (!user?.id) {
      setError('Commercial non identifié.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await immeubleService.getImmeublesForCommercial(user.id);
      setImmeubles(data);
    } catch (err) {
      setError('Impossible de charger les immeubles.');
      toast.error('Impossible de charger les immeubles.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchImmeubles();
  }, [fetchImmeubles]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'nbEtages' || name === 'nbPortesParEtage' ? Number(value) : value)
    }));
  };

  const getProspectingStatus = (immeuble: ImmeubleFromApi) => {
    if (!immeuble.portes || immeuble.portes.length === 0) {
        return { key: 'NON_CONFIGURE', ...buildingStatusMap.NON_CONFIGURE };
    }
    const visitedDoors = immeuble.portes.filter(porte => porte.statut !== 'NON_VISITE').length;
    if (visitedDoors === immeuble.nbPortesTotal) {
        return { key: 'COMPLET', ...buildingStatusMap.COMPLET };
    }
    if (visitedDoors > 0) {
        return {
            key: 'EN_COURS',
            label: `En cours (${visitedDoors}/${immeuble.nbPortesTotal})`,
            className: buildingStatusMap.EN_COURS.className
        };
    }
    return { key: 'NON_COMMENCE', ...buildingStatusMap.NON_COMMENCE };
  };

  const filteredImmeubles = useMemo(() => {
    return immeubles.filter(immeuble => {
        const searchMatch = searchTerm ? 
            immeuble.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.codePostal.toLowerCase().includes(searchTerm.toLowerCase()) 
            : true;

        if (!searchMatch) return false;

        if (activeFilter === 'all') return true;
        if (activeFilter === 'hasElevator') return immeuble.hasElevator;
        if (activeFilter === 'noElevator') return !immeuble.hasElevator;
        if (Object.keys(buildingStatusMap).includes(activeFilter)) {
            return getProspectingStatus(immeuble).key === activeFilter;
        }
        if (activeFilter === 'SOLO' || activeFilter === 'DUO') {
            return immeuble.prospectingMode === activeFilter;
        }
        return true;
    });
  }, [immeubles, searchTerm, activeFilter]);

  const handleOpenModal = (immeuble: ImmeubleFromApi | null = null) => {
    setEditingImmeuble(immeuble);
    if (immeuble) {
      const storedDetails = localStorage.getItem(`building_${immeuble.id}_details`);
      let nbEtages = 1;
      let nbPortesParEtage = 10;

      if (storedDetails) {
        const parsedDetails = JSON.parse(storedDetails);
        nbEtages = parsedDetails.nbEtages || nbEtages;
        nbPortesParEtage = parsedDetails.nbPortesParEtage || nbPortesParEtage;
      } else {
        nbEtages = Math.floor(immeuble.nbPortesTotal / 10) || 1;
        nbPortesParEtage = immeuble.nbPortesTotal % 10 === 0 ? 10 : immeuble.nbPortesTotal % 10;
      }

      setFormState({
        adresse: immeuble.adresse, ville: immeuble.ville, codePostal: immeuble.codePostal,
        nbEtages: nbEtages,
        nbPortesParEtage: nbPortesParEtage,
        hasElevator: immeuble.hasElevator,
        digicode: immeuble.digicode || '', latitude: immeuble.latitude || undefined, longitude: immeuble.longitude || undefined,
      });
    } else {
      setFormState({
        adresse: '', ville: '', codePostal: '', nbEtages: 1, nbPortesParEtage: 10, hasElevator: false,
        digicode: '', latitude: undefined, longitude: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);
    const dataToSubmit = { 
      adresse: formState.adresse,
      ville: formState.ville,
      codePostal: formState.codePostal,
      nbPortesTotal: Number(formState.nbEtages) * Number(formState.nbPortesParEtage),
      hasElevator: formState.hasElevator,
      digicode: formState.digicode,
      latitude: Number(formState.latitude),
      longitude: Number(formState.longitude),
    };
    try {
      if (editingImmeuble) {
        await immeubleService.updateImmeubleForCommercial(editingImmeuble.id, dataToSubmit, user.id);
        localStorage.setItem(`building_${editingImmeuble.id}_details`, JSON.stringify({ nbEtages: formState.nbEtages, nbPortesParEtage: formState.nbPortesParEtage }));
        toast.success('Immeuble mis à jour avec succès.');
      } else {
        const newImmeuble = await immeubleService.createImmeubleForCommercial(dataToSubmit, user.id);
        localStorage.setItem(`building_${newImmeuble.id}_details`, JSON.stringify({ nbEtages: formState.nbEtages, nbPortesParEtage: formState.nbPortesParEtage }));
        toast.success('Immeuble créé avec succès.');
      }
      setIsModalOpen(false);
      fetchImmeubles();
    } catch (error: any) {
      if (error.response && error.response.status === 404 && error.response.data.message.includes('No zone found')) {
        toast.error('Vous devez avoir une zone assignée pour créer un immeuble. Veuillez contacter votre administrateur.');
      } else {
        toast.error('Une erreur est survenue lors de la sauvegarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) {
      toast.error('Commercial non identifié. Impossible de supprimer l\'immeuble.');
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet immeuble ?')) {
      try {
        await immeubleService.deleteImmeubleForCommercial(id, user.id);
        toast.success('Immeuble supprimé.');
        fetchImmeubles();
      } catch (error) {
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-500 p-4 text-center">{error}</div>;

  return (
    <motion.div 
        className="space-y-6 max-w-7xl mx-auto p-4 mb-10 mt-4  sm:p-6 lg:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-800 flex items-center gap-3">
              <Building className="h-8 w-8 text-primary"/>
              Gestion des Immeubles
          </h1>
          <Button onClick={() => handleOpenModal()} className="bg-[hsl(var(--winvest-blue-moyen))] text-white hover:bg-blue-700 w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un immeuble</Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par adresse, ville, code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 w-full rounded-md shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
                { key: 'all', label: 'Tous' },
                { key: 'hasElevator', label: 'Avec Ascenseur', icon: <CheckCircle className="h-4 w-4" /> },
                { key: 'noElevator', label: 'Sans Ascenseur', icon: <XCircle className="h-4 w-4" /> },
                ...Object.entries(buildingStatusMap).map(([key, { label }]) => ({ key, label })),
                { key: 'SOLO', label: 'Solo' },
                { key: 'DUO', label: 'Duo' },
            ].map(
              ({ key, label, icon }: { key: string; label: string; icon?: React.ReactNode }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                    activeFilter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {icon && icon}
                  {label}
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredImmeubles.map((immeuble, index) => (
          <motion.div
            key={immeuble.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
            className="w-full"
          >
            <Card className="flex flex-col h-full rounded-lg bg-card text-card-foreground shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex-row items-start justify-between pb-2">
                <div className="flex-1">
                    <CardTitle className="text-base font-bold break-words">{immeuble.adresse}</CardTitle>
                    <CardDescription className="text-xs">
                      {immeuble.ville}, {immeuble.codePostal}
                    </CardDescription>
                </div>
                <Building className="h-5 w-5 text-muted-foreground ml-2" />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow space-y-2">
                  <p><strong>Statut:</strong> <span className="font-medium text-blue-600">{getProspectingStatus(immeuble).label}</span></p>
                  <p><strong>Zone:</strong> <span className="font-medium text-purple-600">{immeuble.zone?.nom ?? 'N/A'}</span></p>
                  <p><strong>Portes:</strong> <span className="font-medium text-green-600">{immeuble.nbPortesTotal}</span></p>
                  <p><strong>Ascenseur:</strong> <span className="font-medium text-orange-600">{immeuble.hasElevator ? 'Oui' : 'Non'}</span></p>
                  {immeuble.digicode && <p><strong>Digicode:</strong> <span className="font-medium text-red-600">{immeuble.digicode}</span></p>}
                  <p><strong>Mode:</strong> <span className="font-medium text-indigo-600">{immeuble.prospectingMode}</span></p>
              </CardContent>
              <div className="flex justify-end items-center p-2 gap-2 border-t mt-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(immeuble)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(immeuble.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      {filteredImmeubles.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground col-span-full">
          <p className="text-lg">Aucun immeuble ne correspond à vos filtres.</p>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{editingImmeuble ? 'Modifier' : 'Ajouter'} un immeuble</DialogTitle>
            <DialogDescription>Renseignez les informations de l'immeuble. La latitude et longitude sont calculées automatiquement.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="adresse">Adresse</Label>
              <AddressInput
                initialValue={formState.adresse}
                onSelect={(selection) => {
                  setFormState((prev) => ({
                    ...prev,
                    adresse: selection.address,
                    ville: selection.city,
                    codePostal: selection.postalCode,
                    latitude: selection.latitude,
                    longitude: selection.longitude,
                  }));
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" name="ville" value={formState.ville} onChange={handleFormChange} placeholder="Ville" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="codePostal">Code Postal</Label>
                <Input id="codePostal" name="codePostal" value={formState.codePostal} onChange={handleFormChange} placeholder="Code Postal" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="digicode">Digicode (optionnel)</Label>
                <Input id="digicode" name="digicode" value={formState.digicode} onChange={handleFormChange} placeholder="Digicode (optionnel)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nbEtages">Nombre d'étages</Label>
                <Input id="nbEtages" type="number" name="nbEtages" value={formState.nbEtages} onChange={handleFormChange} placeholder="Nb. Étages" required min="1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nbPortesParEtage">Portes par étage</Label>
                <Input id="nbPortesParEtage" type="number" name="nbPortesParEtage" value={formState.nbPortesParEtage} onChange={handleFormChange} placeholder="Portes par étage" required min="1" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="hasElevator" name="hasElevator" checked={formState.hasElevator} onCheckedChange={(checked) => setFormState(prev => ({ ...prev, hasElevator: !!checked }))} />
              <Label htmlFor="hasElevator">Ascenseur présent</Label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--winvest-blue-moyen))] text-white hover:bg-[hsl(var(--winvest-blue-fonce))]">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingImmeuble ? 'Mettre à jour' : 'Créer'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CommercialImmeublesPage;