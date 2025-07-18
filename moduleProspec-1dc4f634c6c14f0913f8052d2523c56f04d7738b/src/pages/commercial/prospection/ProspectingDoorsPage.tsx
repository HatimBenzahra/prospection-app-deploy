// src/pages/commercial/ProspectingDoorsPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui-admin/card';
import { type Porte, statusConfig, statusList, type PorteStatus } from './doors-columns';
import { ArrowLeft, Building, DoorOpen, MessageSquare, Repeat, Edit2, Trash2, Plus } from 'lucide-react';
import { Modal } from '@/components/ui-admin/Modal';
import { Input } from '@/components/ui-admin/input';
import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { Label } from '@/components/ui-admin/label';
import { immeubleService, type ImmeubleDetailsFromApi } from '@/services/immeuble.service';
import { porteService } from '@/services/porte.service';
import { statisticsService } from '@/services/statistics.service';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui-admin/alert-dialog";


const LoadingSkeleton = () => (
    <div className="container mx-auto py-8 p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);

const ProspectingDoorsPage = () => {
    const { buildingId } = useParams<{ buildingId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [building, setBuilding] = useState<ImmeubleDetailsFromApi | null>(null);
    const [portes, setPortes] = useState<Porte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoor, setEditingDoor] = useState<Porte | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<Set<PorteStatus>>(new Set());
    const [showRepassageOnly, setShowRepassageOnly] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [doorToDeleteId, setDoorToDeleteId] = useState<string | null>(null);

    const portesGroupedByFloor = useMemo(() => {
        if (!building) { // Add this null check
            return {};
        }
        const grouped: { [key: number]: Porte[] } = {};
        // Initialize all floors up to building.nbEtages
        const numEtages = building.nbEtages || 1; // Provide a fallback value
        for (let i = 1; i <= numEtages; i++) {
            grouped[i] = [];
        }

        portes.forEach(porte => {
            const floor = porte.etage;
            if (grouped[floor]) { // Only add if the floor exists (within nbEtages)
                grouped[floor].push(porte);
            }
        });

        const filteredGrouped: { [key: number]: Porte[] } = {};

        for (let i = 1; i <= numEtages; i++) {
            let floorPortes = grouped[i];

            // Apply status filters
            if (selectedStatuses.size > 0) {
                floorPortes = floorPortes.filter(p => selectedStatuses.has(p.statut));
            }

            // Apply repassage filter
            if (showRepassageOnly) {
                floorPortes = floorPortes.filter(p => (['ABSENT', 'RDV', 'CURIEUX'].includes(p.statut) && p.passage < 3));
            }

            // Include floor if it has doors after filtering, or if no filters are applied and it's an empty floor
            if (floorPortes.length > 0 || (!showRepassageOnly && selectedStatuses.size === 0)) {
                filteredGrouped[i] = floorPortes;
            }
        }

        return filteredGrouped;
    }, [building, portes, selectedStatuses, showRepassageOnly]);

    const toggleStatusFilter = (status: PorteStatus) => {
        setSelectedStatuses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(status)) {
                newSet.delete(status);
            } else {
                newSet.add(status);
            }
            return newSet;
        });
    };

    const { visitedDoorsCount, coveragePercentage } = useMemo(() => {
        if (!portes.length || !building) {
            return { visitedDoorsCount: 0, coveragePercentage: 0 };
        }

        const visited = portes.filter(p => p.statut !== "NON_VISITE").length;
        const total = building.nbPortesTotal;
        const percentage = total > 0 ? (visited / total) * 100 : 0;

        return {
            visitedDoorsCount: visited,
            coveragePercentage: parseFloat(percentage.toFixed(2)),
        };
    }, [portes, building]);

    const fetchData = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const detailsFromApi = await immeubleService.getImmeubleDetails(id);

            if (detailsFromApi) {
                setBuilding({ ...detailsFromApi });
                if (detailsFromApi.portes && detailsFromApi.portes.length > 0) {
                    const portesFromAPI = detailsFromApi.portes.map((p) => ({
                        id: p.id,
                        numero: p.numeroPorte,
                        statut: p.statut as PorteStatus,
                        commentaire: p.commentaire || null,
                        passage: p.passage,
                        etage: p.etage ?? 1, // fallback if etage is missing
                    }));
                    setPortes(portesFromAPI);
                } else {
                    setPortes([]);
                }
            } else {
                setBuilding(null);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error loading immeuble details:", error);
            setIsLoading(false);
        }
    }, [buildingId, user?.id]); // Corrected: use buildingId instead of immeubleId

    useEffect(() => {
        if (!buildingId) {
            setIsLoading(false);
            return;
        }
        if (!user?.id) {
            console.warn("User ID is not available. Cannot filter doors.");
            setIsLoading(false);
            return;
        }
        fetchData(buildingId);
    }, [buildingId, user?.id, fetchData]);

    const handleEdit = useCallback((doorId: string) => {
        const doorToEdit = portes.find(p => p.id === doorId);
        if (doorToEdit) {
            setEditingDoor(doorToEdit);
            setIsModalOpen(true);
        }
    }, [portes]);

    const handleSaveDoor = async (updatedDoor: Porte) => {
        if (!user) {
            setSaveError("Utilisateur non authentifié.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        const needsRepassage = ['ABSENT', 'RDV', 'CURIEUX'].includes(updatedDoor.statut);
        let newPassage = updatedDoor.passage;
        if (needsRepassage) {
            newPassage = Math.min(updatedDoor.passage + 1, 3);
        }

        try {
            await porteService.updatePorte(updatedDoor.id, {
                statut: updatedDoor.statut,
                commentaire: updatedDoor.commentaire || '',
                numeroPorte: updatedDoor.numero,
                passage: newPassage,
            });
            // Re-fetch all data to ensure consistency after saving a door
            
            // Update the local state directly for fluidity
            setPortes(prevPortes =>
                prevPortes.map(p =>
                    p.id === updatedDoor.id ? { ...updatedDoor, passage: newPassage } : p
                )
            );

            // Trigger history update (this can remain as it's a separate backend call)
            if(buildingId && user.id){ // Ensure user.id is checked here too
                await statisticsService.triggerHistoryUpdate(user.id, buildingId);
            }
            
            setIsModalOpen(false);
            setEditingDoor(null);
            toast.success("Statut de la porte mis à jour avec succès !"); // Add success toast
        } catch (error) {
            setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
            console.error("Erreur lors de la mise à jour de la porte:", error);
            toast.error("Erreur lors de la mise à jour de la porte."); // Add error toast
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDoor = async (floor: number) => {
        if (!buildingId || !user?.id || !building) return;

        // Filter portes for the current floor
        const portesOnCurrentFloor = portes.filter(p => p.etage === floor);

        // Find the highest existing door number on this floor
        let maxDoorNumber = 0;
        if (portesOnCurrentFloor.length > 0) {
            maxDoorNumber = Math.max(...portesOnCurrentFloor.map(p => {
                const match = p.numero.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            }));
        }

        const newDoorNumber = `Porte ${maxDoorNumber + 1}`;

        try {
            const newPorteFromApi = await porteService.createPorte({
                numeroPorte: newDoorNumber,
                etage: floor,
                statut: 'NON_VISITE',
                passage: 0,
                immeubleId: buildingId,
            });
            const newPorte: Porte = {
                id: newPorteFromApi.id,
                numero: newPorteFromApi.numeroPorte,
                etage: newPorteFromApi.etage,
                statut: newPorteFromApi.statut as PorteStatus,
                passage: newPorteFromApi.passage,
                commentaire: newPorteFromApi.commentaire
            };
            setPortes([...portes, newPorte]);
            setBuilding({ ...building, nbPortesTotal: building.nbPortesTotal + 1 });
        } catch (error) {
            console.error("Error adding door:", error);
            toast.error("Erreur lors de l'ajout de la porte.");
        }
    };

    const handleAddFloor = async () => {
        if (!buildingId || !user?.id || !building) return;

        const currentNbEtages = building.nbEtages || 1;
        const currentNbPortesParEtage = building?.nbPortesParEtage || 10;

        const newNbEtages = currentNbEtages + 1;

        try {
            await immeubleService.updateImmeubleForCommercial(buildingId, {
                nbEtages: newNbEtages,
                nbPortesParEtage: currentNbPortesParEtage,
            }, user.id);

            // After updating the building and creating new doors, re-fetch all data to ensure consistency
            await fetchData(buildingId);

            toast.success("Nouvel étage ajouté avec succès !");
        } catch (error) {
            console.error("Error adding floor:", error);
            toast.error("Erreur lors de l'ajout de l'étage.");
        }
    };

    const handleDeleteClick = (doorId: string) => {
        setDoorToDeleteId(doorId);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteDoor = async () => {
        if (!building || !doorToDeleteId) return;
        try {
            await porteService.deletePorte(doorToDeleteId);
            setPortes(portes.filter(p => p.id !== doorToDeleteId));
            setBuilding({ ...building, nbPortesTotal: building.nbPortesTotal - 1 });
            toast.success("Porte supprimée avec succès.");
        } catch (error) {
            console.error("Error deleting door:", error);
            toast.error("Erreur lors de la suppression de la porte.");
        } finally {
            setIsConfirmDeleteOpen(false);
            setDoorToDeleteId(null);
        }
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!building) {
        return (
            <div className="container mx-auto py-8 text-center">
                <h2 className="text-xl font-semibold">Immeuble non trouvé</h2>
                <p className="text-muted-foreground mt-2">Impossible de charger les détails pour cet immeuble.</p>
                <Button variant="outline" onClick={() => navigate('/commercial/prospecting')} className="mt-4">
                    Retour à la sélection
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 mt-4 mb-24 p-4">
            <Button variant="outline" onClick={() => navigate('/commercial/prospecting')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la sélection de l'immeuble
            </Button>
            <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-t-lg shadow-inner">
                    <CardTitle className="text-2xl flex items-center gap-3 text-gray-900">
                        <Building className="h-6 w-6 text-blue-600" />
                        Prospection : {building.adresse}
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                        Voici la liste des {building.nbPortesTotal} portes à prospecter. Mettez à jour leur statut au fur et à mesure.
                    </CardDescription>
                    <CardDescription className="mt-2 text-lg font-semibold text-blue-800">
                        Couverture: {visitedDoorsCount} / {building.nbPortesTotal} portes visitées ({coveragePercentage}%)
                    </CardDescription>
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-blue-200">
                        <span className="text-sm font-medium text-gray-600">Filtrer par statut:</span>
                        {statusList.map(status => {
                            const config = statusConfig[status];
                            const isSelected = selectedStatuses.has(status);
                            return (
                                <button
                                    key={status}
                                    onClick={() => toggleStatusFilter(status)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 ease-in-out",
                                        isSelected 
                                            ? `${config.badgeClassName} ring-2 ring-offset-2 ring-blue-500 shadow-md`
                                            : `bg-gray-100 text-gray-600 hover:bg-gray-200`, 
                                        config.badgeClassName
                                    )}
                                >
                                    <config.icon className="h-3.5 w-3.5" />
                                    {config.label}
                                </button>
                            )
                        })}
                        <button
                            onClick={() => setShowRepassageOnly(!showRepassageOnly)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 ease-in-out",
                                showRepassageOnly
                                    ? 'bg-yellow-500 text-white ring-2 ring-offset-2 ring-yellow-600 shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            <Repeat className="h-3.5 w-3.5" />
                            À repasser
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    {Object.keys(portesGroupedByFloor).length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            Aucune porte à prospecter pour cet immeuble ou ne correspond aux filtres.
                        </div>
                    ) : (
                        <div className="space-y-6 mt-4">
                            {Object.keys(portesGroupedByFloor).sort((a, b) => parseInt(a) - parseInt(b)).map(floor => (
                                <details key={floor} className="border rounded-lg p-4 shadow-sm group">
                                    <summary className="flex justify-between items-center cursor-pointer py-2 px-3 -mx-3 -mt-3 mb-4 font-semibold text-lg bg-blue-50 rounded-t-lg text-gray-800 hover:bg-blue-100 transition-colors duration-200">
                                        <span>Étage {floor} ({portesGroupedByFloor[parseInt(floor)]?.length || 0} portes)</span>
                                        <svg className="h-5 w-5 text-gray-500 transform transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                                        {portesGroupedByFloor[parseInt(floor)].map((porte) => {
                                            const config = statusConfig[porte.statut];
                                            const StatusIcon = config?.icon || DoorOpen;
                                            return (
                                                <motion.div
                                                    key={porte.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    whileHover={{ scale: 1.03, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)" }}
                                                    className="h-full"
                                                >
                                                    <Card 
                                                        className="flex flex-col h-full cursor-pointer bg-card hover:bg-muted/50 transition-colors border border-gray-200 shadow-sm"
                                                        onClick={() => handleEdit(porte.id)}
                                                    >
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center justify-between text-lg">
                                                                <span className="flex items-center gap-2">
                                                                    <DoorOpen className="h-5 w-5" />
                                                                    {porte.numero}
                                                                </span>
                                                                <span 
                                                                    className={cn(
                                                                        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5",
                                                                        config?.badgeClassName
                                                                    )}
                                                                >
                                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                                    {config.label}
                                                                </span>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex-grow space-y-3 text-sm">
                                                            {porte.commentaire ? (
                                                                <div className="flex items-start gap-2.5 text-muted-foreground">
                                                                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <p className="italic line-clamp-2">{porte.commentaire}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-start gap-2.5 text-gray-400">
                                                                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <p className="italic">Aucun commentaire</p>
                                                                </div>
                                                            )}
                                                            {(porte.statut === 'ABSENT' || porte.statut === 'RDV' || porte.statut === 'CURIEUX') && porte.passage > 0 && (
                                                                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                                                                    <div className="flex items-center gap-2">
                                                                        <Repeat className="h-5 w-5 text-muted-foreground" />
                                                                        <span className="font-medium text-sm">Passage</span>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "font-bold text-lg",
                                                                        porte.passage >= 3 ? "text-red-500" : "text-primary"
                                                                    )}>
                                                                        {porte.passage >= 3 ? "Stop" : `${porte.passage}${porte.passage === 1 ? 'er' : 'ème'}`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                        <CardFooter className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="default" 
                                                                className={cn(
                                                                    "flex-grow text-white",
                                                                    config?.buttonClassName
                                                                )} 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(porte.id);
                                                                }}
                                                            >
                                                                <Edit2 className="mr-2 h-4 w-4" />
                                                                Mettre à jour
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="icon"
                                                                className="bg-red-500 hover:bg-red-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(porte.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            whileHover={{ scale: 1.03, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)" }}
                                            className="h-full"
                                        >
                                            <Card 
                                                className="flex flex-col h-full cursor-pointer bg-card hover:bg-muted/50 transition-colors items-center justify-center border-dashed border-2 border-gray-300"
                                                onClick={() => handleAddDoor(parseInt(floor))}
                                            >
                                                <Plus className="h-12 w-12 text-gray-400" />
                                            </Card>
                                        </motion.div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.01, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)" }}
                className="w-full col-span-full mt-8"
            >
                <Card 
                    className="flex flex-col h-full cursor-pointer bg-card hover:bg-muted/50 transition-colors items-center justify-center border-dashed border-2 border-gray-300 py-8"
                    onClick={handleAddFloor}
                >
                    <Plus className="h-16 w-16 text-gray-400" />
                    <p className="mt-4 text-xl font-semibold text-gray-600">Ajouter un étage</p>
                </Card>
            </motion.div>

            {editingDoor && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Éditer la Porte n°${editingDoor.numero}`}
                    maxWidth="sm:max-w-3xl"
                >
                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            <Label htmlFor="numero">Numéro de Porte</Label>
                            <Input
                                id="numero"
                                value={editingDoor.numero || ''}
                                onChange={(e) => setEditingDoor({ ...editingDoor, numero: e.target.value })}
                                placeholder="Numéro de la porte"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <Label>Statut</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {statusList.map((status) => {
                                    const config = statusConfig[status];
                                    const isSelected = editingDoor.statut === status;
                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setEditingDoor({ ...editingDoor, statut: status })}
                                            className={cn(
                                                "w-full py-3 px-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 ease-in-out border",
                                                isSelected
                                                    ? `${config.buttonClassName} text-white shadow-lg ring-2 ring-offset-2 ring-blue-500`
                                                    : `${config.badgeClassName} hover:shadow-md hover:brightness-105`
                                            )}
                                        >
                                            <config.icon className="h-4 w-4" />
                                            <span>{config.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Label htmlFor="commentaire">Commentaire</Label>
                            <Input
                                id="commentaire"
                                value={editingDoor.commentaire || ''}
                                onChange={(e) => setEditingDoor({ ...editingDoor, commentaire: e.target.value })}
                                placeholder="Ajouter un commentaire..."
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Repeat className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-sm text-gray-700">Prochain Passage</span>
                            </div>
                            <span className="font-bold text-lg">
                                {editingDoor.passage >= 3 ? "Non" : editingDoor.passage + 1}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button 
                            type="submit" 
                            onClick={() => handleSaveDoor(editingDoor)} 
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={isSaving}
                        >
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                    {saveError && <p className="text-red-500 text-sm mt-2">{saveError}</p>}
                </Modal>
            )}

            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cela supprimera définitivement cette porte de l'immeuble.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteDoor} className="bg-red-500 hover:bg-red-600 text-white">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProspectingDoorsPage;