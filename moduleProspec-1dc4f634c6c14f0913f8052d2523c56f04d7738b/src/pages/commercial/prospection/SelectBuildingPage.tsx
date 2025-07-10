import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-admin/button';
import { Card, CardContent } from '@/components/ui-admin/card';
import { ArrowRight, Building, MapPin, Calendar as CalendarIcon, Search, Clock, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { immeubleService } from '@/services/immeuble.service';
import { assignmentGoalsService } from '@/services/assignment-goals.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui-admin/radio-group';
import { Label } from '@/components/ui-admin/label';
import { Input } from '@/components/ui-admin/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Assurez-vous que ce type est correct et correspond à ce que votre API renvoie
import type { ImmeubleFromApi as ImmeubleFromApiBase } from '@/services/immeuble.service';
type ImmeubleFromApi = ImmeubleFromApiBase & { zone: { id: string; nom: string } | null };
type AssignedZone = { id: string; nom: string };

const PageSkeleton = () => (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="relative mb-4 md:mb-6">
            <Skeleton className="h-16 w-full rounded-full" />
        </div>
        <div className="mb-8 md:mb-12">
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
    </div>
);

const buildingStatusMap: { [key: string]: { label: string; className: string } } = {
    NON_CONFIGURE: { label: "Non configuré", className: "bg-gray-200 text-gray-700" },
    NON_COMMENCE: { label: "À commencer", className: "bg-yellow-100 text-yellow-800" },
    EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-800" },
    COMPLET: { label: "Complet", className: "bg-green-100 text-green-800" },
};

const SelectBuildingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allImmeubles, setAllImmeubles] = useState<ImmeubleFromApi[]>([]);
    const [assignedZone, setAssignedZone] = useState<AssignedZone | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<string>('recent'); // 'recent', 'incomplete', or 'my_zone'

    const fetchInitialData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const [immeublesData, zonesData] = await Promise.all([
                immeubleService.getImmeublesForCommercial(user.id),
                assignmentGoalsService.getAssignedZonesForCommercial(user.id)
            ]);

            const sortedImmeubles = immeublesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAllImmeubles(sortedImmeubles as ImmeubleFromApi[]);

            if (zonesData && zonesData.length > 0) {
                setAssignedZone(zonesData[0]);
            }

        } catch (err) {
            toast.error('Impossible de charger les données.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

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

    const displayedImmeubles = useMemo(() => {
        let textFiltered = allImmeubles.filter(immeuble => 
            immeuble.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.codePostal.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeFilter === 'incomplete') {
            return textFiltered.filter(im => getProspectingStatus(im).key === 'EN_COURS');
        } 
        
        if (activeFilter === 'my_zone') {
            if (!assignedZone) return [];
            return textFiltered.filter(im => im.zone?.id === assignedZone.id);
        }

        // Default filter: 'recent'
        if (searchTerm) {
            return textFiltered;
        }
        return textFiltered.slice(0, 3);

    }, [allImmeubles, searchTerm, activeFilter, assignedZone]);

    const handleNext = () => {
        if (selectedBuildingId) {
            const selectedBuilding = allImmeubles.find(b => b.id === selectedBuildingId);
            if (selectedBuilding && selectedBuilding.prospectingMode && selectedBuilding.portes && selectedBuilding.portes.length > 0) {
                navigate(`doors/${selectedBuildingId}`);
            } else {
                navigate(`setup/${selectedBuildingId}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                 <PageSkeleton />
            </div>
        );
    }

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    const filterOptions = [
        { id: 'recent', label: 'Plus récents', icon: Clock },
        { id: 'incomplete', label: 'À compléter', icon: ClipboardList },
    ];
    if (assignedZone) {
        filterOptions.push({ id: 'my_zone', label: `Ma Zone (${assignedZone.nom})`, icon: MapPin });
    }

    return (
        <div className="min-h-screen bg-white">
            <motion.div 
                className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="text-center mb-8" variants={itemVariants}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-800 flex items-center justify-center gap-4">
                        <Building className="h-10 w-10 text-primary"/>
                        Sélection de l'immeuble
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
                        Choisissez un immeuble à prospecter ou utilisez les filtres pour affiner votre recherche.
                    </p>
                </motion.div>

                <motion.div className="relative mb-4" variants={itemVariants}>
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <Input
                        placeholder="Rechercher par adresse, ville, code postal..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-16 pl-16 pr-6 w-full text-lg rounded-full shadow-lg bg-white border-gray-200 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    />
                </motion.div>

                <motion.div className="mb-8 flex items-center gap-2 overflow-x-auto pb-4" variants={itemVariants}>
                    {filterOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setActiveFilter(opt.id)}
                            className={cn(
                                "px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ease-in-out whitespace-nowrap",
                                activeFilter === opt.id
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                        </button>
                    ))}
                </motion.div>

                <motion.div variants={itemVariants}>
                    <AnimatePresence mode="wait">
                        {displayedImmeubles.length === 0 ? (
                            <motion.div
                                key="no-results"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center text-gray-500 py-16"
                            >
                                <p className="text-lg">{searchTerm ? "Aucun immeuble ne correspond à votre recherche." : "Aucun immeuble ne correspond à ce filtre."}</p>
                            </motion.div>
                        ) : (
                            <RadioGroup onValueChange={setSelectedBuildingId} value={selectedBuildingId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedImmeubles.map((immeuble) => {
                                    const prospectingStatus = getProspectingStatus(immeuble);
                                    const isSelected = selectedBuildingId === immeuble.id;
                                    return (
                                        <motion.div
                                            key={immeuble.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ y: -5, scale: 1.03 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className={`rounded-2xl transition-all duration-300 ${isSelected ? 'ring-2 ring-primary ring-offset-4 ring-offset-white' : ''}`}
                                        >
                                            <Card 
                                                className={`h-full w-full cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white`}
                                                onClick={() => setSelectedBuildingId(immeuble.id)}
                                            >
                                                <CardContent className="p-6 flex flex-col justify-between h-full">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${prospectingStatus.className}`}>
                                                                {prospectingStatus.label}
                                                            </span>
                                                            <RadioGroupItem value={immeuble.id} id={immeuble.id} />
                                                        </div>
                                                        <Label htmlFor={immeuble.id} className="cursor-pointer">
                                                            <h3 className="text-xl font-bold text-gray-800 flex items-start gap-3">
                                                                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                                                <span>{immeuble.adresse}, {immeuble.ville}</span>
                                                            </h3>
                                                        </Label>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 space-y-2">
                                                         <div className="flex items-center justify-between">
                                                            <span>Mode de prospection:</span>
                                                            <span className="font-medium text-gray-700">
                                                                {immeuble.prospectingMode === 'DUO' ? `Duo (${Math.ceil(immeuble.nbPortesTotal / 2)} visites)` : `Solo (${immeuble.nbPortesTotal} portes)`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Ajouté le:</span>
                                                            <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                                                <CalendarIcon className="h-4 w-4" />
                                                                {format(new Date(immeuble.createdAt), "d MMM yyyy", { locale: fr })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </RadioGroup>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div layout className="flex justify-center mt-10 md:mt-16">
                    <Button 
                        onClick={handleNext} 
                        disabled={!selectedBuildingId} 
                        size="lg"
                        className="h-14 px-10 text-lg font-bold rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Suivant <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SelectBuildingPage;