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
    <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
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
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'hasElevator', 'noElevator', 'NON_CONFIGURE', 'NON_COMMENCE', 'EN_COURS', 'COMPLET', 'SOLO', 'DUO'

  

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
    let filtered = immeubles;

    if (searchTerm) {
      filtered = filtered.filter(immeuble => 
        immeuble.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        immeuble.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        immeuble.codePostal.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilter === 'hasElevator') {
      filtered = filtered.filter(immeuble => immeuble.hasElevator);
    } else if (activeFilter === 'noElevator') {
      filtered = filtered.filter(immeuble => !immeuble.hasElevator);
    } else if (activeFilter === 'NON_CONFIGURE') {
      filtered = filtered.filter(immeuble => getProspectingStatus(immeuble).key === 'NON_CONFIGURE');
    } else if (activeFilter === 'NON_COMMENCE') {
      filtered = filtered.filter(immeuble => getProspectingStatus(immeuble).key === 'NON_COMMENCE');
    } else if (activeFilter === 'EN_COURS') {
      filtered = filtered.filter(immeuble => getProspectingStatus(immeuble).key === 'EN_COURS');
    } else if (activeFilter === 'COMPLET') {
      filtered = filtered.filter(immeuble => getProspectingStatus(immeuble).key === 'COMPLET');
    } else if (activeFilter === 'SOLO') {
      filtered = filtered.filter(immeuble => immeuble.prospectingMode === 'SOLO');
    } else if (activeFilter === 'DUO') {
      filtered = filtered.filter(immeuble => immeuble.prospectingMode === 'DUO');
    }

    return filtered;
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
        // Fallback to deduction if not found in localStorage
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
        console.log('Attempting to delete immeuble with ID:', id, 'for commercial ID:', user.id);
        await immeubleService.deleteImmeubleForCommercial(id, user.id);
        toast.success('Immeuble supprimé.');
        fetchImmeubles();
      } catch (error) {
        console.error('Erreur deleting immeuble:', error);
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <motion.div 
        className="space-y-8 max-w-7xl mx-auto p-4"
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
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par adresse, ville, code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 w-full rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveFilter('hasElevator')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'hasElevator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <CheckCircle className="h-4 w-4" />
              Avec Ascenseur
            </button>
            <button
              onClick={() => setActiveFilter('noElevator')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'noElevator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <XCircle className="h-4 w-4" />
              Sans Ascenseur
            </button>
            <button
              onClick={() => setActiveFilter('NON_CONFIGURE')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'NON_CONFIGURE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Non configuré
            </button>
            <button
              onClick={() => setActiveFilter('NON_COMMENCE')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'NON_COMMENCE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              À commencer
            </button>
            <button
              onClick={() => setActiveFilter('EN_COURS')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'EN_COURS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              En cours
            </button>
            <button
              onClick={() => setActiveFilter('COMPLET')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'COMPLET'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Complet
            </button>
            <button
              onClick={() => setActiveFilter('SOLO')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'SOLO'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Solo
            </button>
            <button
              onClick={() => setActiveFilter('DUO')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                activeFilter === 'DUO'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Duo
            </button>
          </div>

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
                <Card className="flex flex-col h-full rounded-2xl bg-card text-card-foreground shadow-md hover:shadow-xl transition-shadow duration-300 min-w-0 flex-shrink-0">
                  <CardHeader className="flex-row items-center justify-between pb-2 min-w-0">
                    <CardTitle className="text-lg break-words">{immeuble.adresse}</CardTitle>
                    <Building className="h-6 w-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex-grow">
                    <CardDescription className="text-sm break-words w-full">
                      {immeuble.ville}, {immeuble.codePostal}
                    </CardDescription>
                    <div className="mt-2 text-sm break-words w-full space-y-1">
                      <p className="min-w-0"><strong>Statut:</strong> <span className="font-medium text-blue-600 break-words">{getProspectingStatus(immeuble).label}</span></p>
                      <p className="min-w-0"><strong>Zone:</strong> <span className="font-medium text-purple-600 break-words">{immeuble.zone?.nom ?? 'N/A'}</span></p>
                      <p className="min-w-0"><strong>Portes:</strong> <span className="font-medium text-green-600 break-words">{immeuble.nbPortesTotal}</span></p>
                      <p className="min-w-0"><strong>Étages:</strong> <span className="font-medium text-green-600 break-words">{(() => {
                        const storedDetails = localStorage.getItem(`building_${immeuble.id}_details`);
                        if (storedDetails) {
                          return JSON.parse(storedDetails).nbEtages;
                        }
                        return Math.floor(immeuble.nbPortesTotal / 10) || 1;
                      })()}</span></p>
                      <p className="min-w-0"><strong>Portes par étage:</strong> <span className="font-medium text-green-600 break-words">{(() => {
                        const storedDetails = localStorage.getItem(`building_${immeuble.id}_details`);
                        if (storedDetails) {
                          return JSON.parse(storedDetails).nbPortesParEtage;
                        }
                        return immeuble.nbPortesTotal % 10 === 0 ? 10 : immeuble.nbPortesTotal % 10;
                      })()}</span></p>
                      <p className="min-w-0"><strong>Ascenseur:</strong> <span className="font-medium text-orange-600 break-words">{immeuble.hasElevator ? 'Oui' : 'Non'}</span></p>
                      {immeuble.digicode && <p className="min-w-0"><strong>Digicode:</strong> <span className="font-medium text-red-600 break-words">{immeuble.digicode}</span></p>}
                      <p className="min-w-0"><strong>Mode:</strong> <span className="font-medium text-indigo-600 break-words">{immeuble.prospectingMode === 'DUO' ? 'Duo' : (immeuble.prospectingMode === 'SOLO' ? 'Solo' : '')}</span></p>
                    </div>
                  </CardContent>
                  <div className="flex flex-col sm:flex-row justify-end items-end p-4 pt-0 gap-2">
                    <Button className="bg-[hsl(var(--winvest-blue-moyen))] text-white hover:bg-blue-700 w-full sm:w-auto" size="sm" onClick={() => handleOpenModal(immeuble)}><Edit className="h-4 w-4 mr-2" />Modifier</Button>
                    <Button className="bg-red-500 text-white hover:bg-red-600 w-full sm:w-auto" size="sm" onClick={() => handleDelete(immeuble.id)}><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          {filteredImmeubles.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun immeuble trouvé.
            </div>
          )}
        </CardContent>
      </Card>

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
