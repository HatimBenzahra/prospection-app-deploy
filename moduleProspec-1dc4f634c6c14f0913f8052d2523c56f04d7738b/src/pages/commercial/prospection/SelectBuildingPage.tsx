import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-admin/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { ArrowRight, Building, MapPin, Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { immeubleService, type ImmeubleFromApi } from '@/services/immeuble.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui-admin/radio-group';
import { Label } from '@/components/ui-admin/label';
import { Input } from '@/components/ui-admin/input';
import { motion } from 'framer-motion';

const PageSkeleton = () => (
    <Card className="w-full md:max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
                <Building className="h-6 w-6 text-primary"/>
                Étape 1 : Sélection de l'immeuble
            </CardTitle>
            <CardDescription>
                Choisissez l'immeuble que vous souhaitez prospecter. Les plus récents apparaissent en premier.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </CardContent>
    </Card>
);

const buildingStatusMap: { [key: string]: { label: string; className: string } } = {
    NON_COMMENCE: { label: "Non commencé", className: "bg-gray-100 text-gray-800" },
    EN_COURS: { label: "En cours", className: "bg-[hsl(var(--winvest-blue-moyen))] text-white" }, // Using winvest-blue-moyen
};

const SelectBuildingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allImmeubles, setAllImmeubles] = useState<ImmeubleFromApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    const fetchImmeubles = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await immeubleService.getImmeublesForCommercial(user.id);
            const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAllImmeubles(sortedData);
        } catch (err) {
            toast.error('Impossible de charger les immeubles.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchImmeubles();
    }, [fetchImmeubles]);

    const displayedImmeubles = useMemo(() => {
        const filtered = allImmeubles.filter(immeuble => 
            immeuble.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
            immeuble.codePostal.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return searchTerm ? filtered : filtered.slice(0, 3);
    }, [allImmeubles, searchTerm]);

    const getProspectingStatus = (immeuble: ImmeubleFromApi) => {
        const configuredDoors = immeuble.portes?.filter(porte => porte.statut !== 'NON_VISITE').length || 0;
        if (configuredDoors > 0) {
            return {
                label: `Commencé (${configuredDoors}/${immeuble.nbPortesTotal})`,
                className: buildingStatusMap.EN_COURS.className
            };
        } else {
            return buildingStatusMap.NON_COMMENCE;
        }
    };

    const handleNext = () => {
        if (selectedBuildingId) {
            const selectedBuilding = allImmeubles.find(b => b.id === selectedBuildingId);
            if (selectedBuilding && selectedBuilding.prospectingMode && selectedBuilding.portes && selectedBuilding.portes.length > 0) {
                // If already configured, go directly to doors page
                navigate(`/commercial/prospection/doors/${selectedBuildingId}`);
            } else {
                // Otherwise, go to setup page
                navigate(`/commercial/prospection/setup/${selectedBuildingId}`);
            }
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8 p-4"><PageSkeleton /></div>;
    }

    return (
        <div className="container mx-auto py-8 p-4 min-h-screen flex items-center justify-center">
            <Card className="w-full md:max-w-4xl mx-auto shadow-lg rounded-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <Building className="h-6 w-6 text-primary"/>
                        Étape 1 : Sélection de l'immeuble
                    </CardTitle>
                    <CardDescription>
                        Choisissez l'immeuble que you souhaitez prospecter. Les 3 plus récents sont affichés. Utilisez la recherche pour en trouver d'autres.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par adresse, ville ou code postal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {displayedImmeubles.length === 0 && searchTerm !== '' ? (
                        <p className="text-center text-muted-foreground">Aucun immeuble trouvé pour votre recherche.</p>
                    ) : displayedImmeubles.length === 0 ? (
                        <p className="text-center text-muted-foreground">Aucun immeuble disponible pour la prospection.</p>
                    ) : (
                        <RadioGroup onValueChange={setSelectedBuildingId} value={selectedBuildingId} className="grid grid-cols-1 gap-4">
                            {displayedImmeubles.map((immeuble, index) => {
                                const prospectingStatus = getProspectingStatus(immeuble);
                                return (
                                    <motion.div
                                        key={immeuble.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Card 
                                            className={`relative p-4 cursor-pointer bg-card border shadow-sm transition-all duration-200 ${selectedBuildingId === immeuble.id ? 'border-2 border-[hsl(var(--winvest-blue-moyen))] shadow-lg scale-[1.01] bg-[hsl(var(--winvest-blue-moyen))]/5' : 'hover:shadow-md hover:scale-[1.01]'}`}
                                            onClick={() => setSelectedBuildingId(immeuble.id)}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <RadioGroupItem value={immeuble.id} id={immeuble.id} className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor={immeuble.id} className="grid gap-1.5 font-medium leading-none cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-lg font-semibold flex items-center gap-2">
                                                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                                                {immeuble.adresse}, {immeuble.ville}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                                        <CalendarIcon className="h-4 w-4" />
                                                                        {format(new Date(immeuble.createdAt), "d MMM yyyy", { locale: fr })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {immeuble.prospectingMode === 'DUO' 
                                                                            ? `${Math.ceil(immeuble.nbPortesTotal / 2)} / ${immeuble.nbPortesTotal} portes (Duo)`
                                                                            : `${immeuble.nbPortesTotal} portes (Solo)`}
                                                                    </p>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${prospectingStatus.className}`}>
                                                                        {prospectingStatus.label}
                                                                    </span>
                                                                </div>
                                                    </Label>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </RadioGroup>
                    )}
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleNext} disabled={!selectedBuildingId} className="bg-green-600 hover:bg-green-700 text-white">
                            Suivant <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SelectBuildingPage;