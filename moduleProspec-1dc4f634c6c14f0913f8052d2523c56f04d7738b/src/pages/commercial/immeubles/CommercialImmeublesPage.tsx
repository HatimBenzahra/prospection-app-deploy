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
import { Loader2, PlusCircle, Building, Trash2, Edit, Search, CheckCircle, XCircle, Users, User, MapPin, ArrowUpDown, KeyRound, Info, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui-admin/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-admin/tooltip';

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

const buildingStatusMap: { [key: string]: { label: string; className: string; icon: React.ElementType } } = {
    NON_CONFIGURE: { label: "Non configuré", className: "bg-gray-100 text-gray-600", icon: XCircle },
    NON_COMMENCE: { label: "À commencer", className: "bg-yellow-100 text-yellow-700", icon: Info },
    EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-700", icon: Loader2 },
    COMPLET: { label: "Complet", className: "bg-green-100 text-green-700", icon: CheckCircle },
};

const PageSkeleton = () => (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 animate-pulse max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-12 w-36" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
            </div>
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
  const [formStep, setFormStep] = useState(1);

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
            className: buildingStatusMap.EN_COURS.className,
            icon: buildingStatusMap.EN_COURS.icon
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
    setFormStep(1);
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

  const handleNextStep = () => {
    if (formStep === 1) {
        if (!formState.adresse || !formState.ville || !formState.codePostal) {
            toast.warning('Veuillez remplir tous les champs d adresse.');
            return;
        }
    }
    setFormStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (formState.nbEtages <= 0 || formState.nbPortesParEtage <= 0) {
        toast.error("Le nombre d'étages et de portes doit être supérieur à zéro.");
        return;
    }
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
      toast.error('Commercial non identifié. Impossible de supprimer limmeuble.');
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet immeuble ? Cette action est irréversible.')) {
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
  if (error) return <div className="text-red-500 p-4 text-center bg-red-50 h-screen">{error}</div>;

  const FilterButton = ({ filterKey, label, icon }: { filterKey: string, label: string, icon?: React.ReactNode }) => (
    <button
      key={filterKey}
      onClick={() => setActiveFilter(filterKey)}
      className={cn(
        "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-300 ease-in-out whitespace-nowrap shadow-sm",
        activeFilter === filterKey
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
        <motion.div 
            className="space-y-8 max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
                        <Building className="h-10 w-10 text-primary"/>
                        Mes Immeubles
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Consultez, modifiez et ajoutez les immeubles qui vous sont assignés.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-6 py-3 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> 
                    Ajouter un immeuble
                </Button>
            </div>

            <Card className="rounded-2xl shadow-lg border-none">
                <CardContent className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Rechercher par adresse, ville, code postal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 w-full rounded-xl shadow-inner bg-gray-100 border-transparent focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                        <FilterButton filterKey="all" label="Tous" />
                        <FilterButton filterKey="hasElevator" label="Ascenseur" icon={<ArrowUpDown className="h-4 w-4" />} />
                        {Object.entries(buildingStatusMap).map(([key, { label, icon: Icon }]) => (
                            <FilterButton key={key} filterKey={key} label={label} icon={<Icon className={cn("h-4 w-4", key === 'EN_COURS' && 'animate-spin')} />} />
                        ))}
                        <FilterButton filterKey="SOLO" label="Solo" icon={<User className="h-4 w-4" />} />
                        <FilterButton filterKey="DUO" label="Duo" icon={<Users className="h-4 w-4" />} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredImmeubles.map((immeuble, index) => {
                    const status = getProspectingStatus(immeuble);
                    const StatusIcon = status.icon;
                    return (
                        <motion.div
                            key={immeuble.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="w-full h-full"
                        >
                            <Card className="flex flex-col h-full rounded-2xl bg-white text-card-foreground shadow-lg hover:shadow-2xl transition-all duration-300 border-none transform hover:-translate-y-1">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn("px-3 py-1 text-xs font-bold rounded-full flex items-center gap-2", status.className)}>
                                            <StatusIcon className={cn("h-4 w-4", status.key === 'EN_COURS' && 'animate-spin')} />
                                            {status.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100" onClick={() => handleOpenModal(immeuble)}><Edit className="h-4 w-4 text-gray-500" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Modifier</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(immeuble.id)}><Trash2 className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Supprimer</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg font-bold break-words text-gray-800">{immeuble.adresse}</CardTitle>
                                    <CardDescription className="text-sm text-gray-500 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {immeuble.ville}, {immeuble.codePostal}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground flex-grow space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="font-semibold text-gray-800 text-xl">{immeuble.nbPortesTotal}</p>
                                            <p className="text-xs text-gray-500">Portes</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="font-semibold text-gray-800 text-xl">{immeuble.hasElevator ? 'Oui' : 'Non'}</p>
                                            <p className="text-xs text-gray-500">Ascenseur</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-600 flex items-center gap-2">
                                            {immeuble.prospectingMode === 'SOLO' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                            Mode
                                        </span>
                                        <span className="font-bold text-gray-800">{immeuble.prospectingMode}</span>
                                    </div>
                                    {immeuble.digicode && (
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <span className="font-semibold text-red-600 flex items-center gap-2"><KeyRound className="h-4 w-4" />Digicode</span>
                                            <span className="font-bold text-red-800">{immeuble.digicode}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
            {filteredImmeubles.length === 0 && !loading && (
                <div className="text-center py-20 col-span-full bg-white rounded-2xl shadow-lg">
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-xl font-semibold text-gray-800">Aucun immeuble trouvé</p>
                    <p className="text-gray-500 mt-2">Essayez de modifier vos filtres ou d'ajouter un nouvel immeuble.</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                    <DialogHeader className="px-6 pt-6 text-center">
                        <DialogTitle className="text-2xl font-bold text-gray-800">{editingImmeuble ? 'Modifier limmeuble' : 'Ajouter un nouvel immeuble'}</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            {formStep === 1 ? "Commencez par l'adresse de l'immeuble." : "Ajoutez les détails de l'immeuble."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Progress Bar */}
                    <div className="px-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                                className="bg-blue-600 h-2 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: formStep === 1 ? '50%' : '100%' }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-6 p-6">
                        <AnimatePresence mode="wait">
                            {formStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid gap-4"
                                >
                                    <div className="grid gap-3">
                                        <Label htmlFor="adresse" className="font-semibold">Adresse</Label>
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
                                    <div className="grid gap-3">
                                        <Label htmlFor="ville" className="font-semibold">Ville</Label>
                                        <Input id="ville" name="ville" value={formState.ville} onChange={handleFormChange} placeholder="Ex: Paris" required className="py-3" />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="codePostal" className="font-semibold">Code Postal</Label>
                                        <Input id="codePostal" name="codePostal" value={formState.codePostal} onChange={handleFormChange} placeholder="Ex: 75001" required className="py-3" />
                                    </div>
                                </motion.div>
                            )}

                            {formStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid gap-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="nbEtages" className="font-semibold">Étages</Label>
                                            <Input id="nbEtages" type="number" name="nbEtages" value={formState.nbEtages} onChange={handleFormChange} placeholder="Nb." required min="1" className="py-3" />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="nbPortesParEtage" className="font-semibold">Portes / étage</Label>
                                            <Input id="nbPortesParEtage" type="number" name="nbPortesParEtage" value={formState.nbPortesParEtage} onChange={handleFormChange} placeholder="Nb." required min="1" className="py-3" />
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="digicode" className="font-semibold">Digicode</Label>
                                        <Input id="digicode" name="digicode" value={formState.digicode} onChange={handleFormChange} placeholder="Optionnel" className="py-3" />
                                    </div>
                                    <div className="flex items-center space-x-3 pt-2">
                                        <Checkbox id="hasElevator" name="hasElevator" checked={formState.hasElevator} onCheckedChange={(checked) => setFormState(prev => ({ ...prev, hasElevator: !!checked }))} className="h-5 w-5" />
                                        <Label htmlFor="hasElevator" className="font-semibold text-base">Présence d'un ascenseur</Label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <DialogFooter className="pt-6 flex justify-between w-full">
                            {formStep === 1 ? (
                                <>
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg">Annuler</Button>
                                    <Button type="button" onClick={handleNextStep} className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-3">
                                        Suivant
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button type="button" variant="outline" onClick={() => setFormStep(1)} className="px-6 py-3 rounded-lg flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Précédent
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-3">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingImmeuble ? 'Mettre à jour' : 'Créer limmeuble'}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    </div>
  );
};

export default CommercialImmeublesPage;
