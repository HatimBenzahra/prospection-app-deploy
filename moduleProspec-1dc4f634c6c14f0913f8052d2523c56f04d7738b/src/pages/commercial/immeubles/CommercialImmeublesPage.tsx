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
    NON_CONFIGURE: { label: "Non configuré", className: "bg-slate-100 text-slate-600", icon: XCircle },
    NON_COMMENCE: { label: "À commencer", className: "bg-yellow-100 text-yellow-700", icon: Info },
    EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-700", icon: Loader2 },
    COMPLET: { label: "Complet", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
};

const PageSkeleton = () => (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 animate-pulse max-w-screen-2xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/2 bg-slate-200 rounded-lg" />
                <Skeleton className="h-12 w-36 bg-slate-200 rounded-lg" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl bg-slate-200" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl bg-slate-200" />)}
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
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setImmeubles(sortedData);
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
            toast.warning('Veuillez remplir tous les champs d\'adresse.');
            return;
        }
    }
    setFormStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!editingImmeuble && (formState.nbEtages <= 0 || formState.nbPortesParEtage <= 0)) {
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
      ...(editingImmeuble ? {} : { nbEtages: Number(formState.nbEtages), nbPortesParEtage: Number(formState.nbPortesParEtage) }),
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
        "px-3 py-1.5 text-sm rounded-md font-semibold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap",
        activeFilter === filterKey
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-slate-600 hover:bg-slate-200/60'
      )}
    >
      {icon}
      {label}
    </button>
  );

  const getBuildingDetails = (immeuble: ImmeubleFromApi) => ({
    nbEtages: (immeuble as any).nbEtages ?? 1,
    nbPortesParEtage: (immeuble as any).nbPortesParEtage ?? 10,
  });

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen">
        <motion.div 
            className="space-y-8 max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Building className="h-8 w-8 text-blue-500"/>
                        Mes Immeubles
                    </h1>
                    <p className="mt-2 text-lg text-slate-600">Consultez, modifiez et ajoutez les immeubles qui vous sont assignés.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-5 py-2.5 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> 
                    Ajouter un immeuble
                </Button>
            </div>

            <Card className="rounded-2xl bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Rechercher par adresse, ville, code postal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-lg bg-slate-100 border-transparent focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                            <FilterButton filterKey="all" label="Tous" />
                            <FilterButton filterKey="hasElevator" label="Ascenseur" icon={<ArrowUpDown className="h-4 w-4" />} />
                            {Object.entries(buildingStatusMap).map(([key, { label, icon: Icon }]) => (
                                <FilterButton key={key} filterKey={key} label={label} icon={<Icon className={cn("h-4 w-4", key === 'EN_COURS' && 'animate-spin')} />} />
                            ))}
                            <FilterButton filterKey="SOLO" label="Solo" icon={<User className="h-4 w-4" />} />
                            <FilterButton filterKey="DUO" label="Duo" icon={<Users className="h-4 w-4" />} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            <Card className="flex flex-col h-full rounded-2xl bg-white text-card-foreground shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <CardHeader className="pb-3 px-5 pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5", status.className)}>
                                            <StatusIcon className={cn("h-3.5 w-3.5", status.key === 'EN_COURS' && 'animate-spin')} />
                                            {status.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => handleOpenModal(immeuble)}><Edit className="h-4 w-4 text-slate-500" /></Button>
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
                                    <CardTitle className="text-md font-bold break-words text-slate-800">{immeuble.adresse}</CardTitle>
                                    <CardDescription className="text-sm text-slate-500 flex items-center gap-2 pt-1">
                                        <MapPin className="h-4 w-4" />
                                        {immeuble.ville}, {immeuble.codePostal}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground flex-grow space-y-3 px-5 pb-4 pt-2">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <p className="font-semibold text-slate-800 text-base">{getBuildingDetails(immeuble).nbEtages}</p>
                                            <p className="text-xs text-slate-500">Étages</p>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <p className="font-semibold text-slate-800 text-base">{immeuble.nbPortesTotal}</p>
                                            <p className="text-xs text-slate-500">Portes</p>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <p className="font-semibold text-slate-800 text-base">{immeuble.hasElevator ? 'Oui' : 'Non'}</p>
                                            <p className="text-xs text-slate-500">Ascenseur</p>
                                        </div>
                                    </div>
                                    {status.key !== 'NON_CONFIGURE' && (
                                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                                            <span className="font-semibold text-slate-600 flex items-center gap-2">
                                                {immeuble.prospectingMode === 'SOLO' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                                Mode
                                            </span>
                                            <span className="font-bold text-slate-800">{immeuble.prospectingMode}</span>
                                        </div>
                                    )}
                                    {immeuble.digicode && (
                                        <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
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
                <div className="text-center py-20 col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <Search className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-xl font-semibold text-slate-800">Aucun immeuble trouvé</p>
                    <p className="text-slate-500 mt-2">Essayez de modifier vos filtres ou d'ajouter un nouvel immeuble.</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                    <DialogHeader className="px-6 pt-6 text-center">
                        <DialogTitle className="text-2xl font-bold text-slate-800">
                            {editingImmeuble ? "Modifier l'immeuble" : "Ajouter un nouvel immeuble"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-600">
                            {formStep === 1
                                ? "Commencez par l'adresse de l'immeuble."
                                : "Ajoutez les détails de l'immeuble."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6">
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <motion.div
                                className="bg-blue-600 h-1.5 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: formStep === 1 ? "50%" : "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {formStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="grid gap-4 p-6"
                            >
                                <div className="grid gap-2">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ville" className="font-semibold">Ville</Label>
                                        <Input id="ville" name="ville" value={formState.ville} onChange={handleFormChange} placeholder="Ex : Paris" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="codePostal" className="font-semibold">Code Postal</Label>
                                        <Input id="codePostal" name="codePostal" value={formState.codePostal} onChange={handleFormChange} placeholder="Ex : 75001" required />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4 flex justify-between w-full">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button type="button" onClick={handleNextStep} className="bg-blue-600 text-white hover:bg-blue-700">Suivant</Button>
                                </DialogFooter>
                            </motion.div>
                        )}

                        {formStep === 2 && (
                            <form key="step2" onSubmit={handleSubmit} className="grid gap-4 p-6">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid gap-4"
                                >
                                    {!editingImmeuble && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="nbEtages" className="font-semibold">Étages</Label>
                                                <Input id="nbEtages" type="number" name="nbEtages" value={formState.nbEtages} onChange={handleFormChange} min="1" required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="nbPortesParEtage" className="font-semibold">Portes / étage</Label>
                                                <Input id="nbPortesParEtage" type="number" name="nbPortesParEtage" value={formState.nbPortesParEtage} onChange={handleFormChange} min="1" required />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="digicode" className="font-semibold">Digicode</Label>
                                        <Input id="digicode" name="digicode" value={formState.digicode} onChange={handleFormChange} placeholder="Optionnel" />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="hasElevator" name="hasElevator" checked={formState.hasElevator} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, hasElevator: !!checked }))} />
                                        <Label htmlFor="hasElevator" className="font-semibold text-base">Présence d'un ascenseur</Label>
                                    </div>
                                </motion.div>
                                <DialogFooter className="pt-4 flex justify-between w-full">
                                    <Button type="button" variant="outline" onClick={() => setFormStep(1)} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Précédent</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingImmeuble ? "Mettre à jour" : "Créer l'immeuble"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </motion.div>
    </div>
  );
};

export default CommercialImmeublesPage;