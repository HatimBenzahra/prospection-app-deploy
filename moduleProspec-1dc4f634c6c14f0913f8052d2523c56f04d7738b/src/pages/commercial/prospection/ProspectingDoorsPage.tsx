// src/pages/commercial/ProspectingDoorsPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { DataTable } from '@/components/data-table/DataTable';
import { createDoorsColumns, type Porte, statusConfig, statusList, type PorteStatus } from './doors-columns';
import { ArrowLeft, Building } from 'lucide-react';
import { Modal } from '@/components/ui-admin/Modal';
import { Input } from '@/components/ui-admin/input';
import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { Label } from '@/components/ui-admin/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { Checkbox } from '@/components/ui-admin/checkbox';
import { immeubleService, type ImmeubleDetailsFromApi } from '@/services/immeuble.service';
import { porteService } from '@/services/porte.service';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';


const LoadingSkeleton = () => (
    <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);

const ProspectingDoorsPage = () => {
    const { buildingId } = useParams<{ buildingId: string }>();
    console.log("ProspectingDoorsPage - buildingId:", buildingId);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [building, setBuilding] = useState<ImmeubleDetailsFromApi | null>(null);
    const [portes, setPortes] = useState<Porte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoor, setEditingDoor] = useState<Porte | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // NEW: Calculate coverage statistics
    const { visitedDoorsCount, coveragePercentage } = useMemo(() => {
        if (!portes.length || !building) {
            return { visitedDoorsCount: 0, coveragePercentage: 0 };
        }

        const visited = portes.filter(p => p.statut !== "NON_VISITE").length;
        const total = building.nbPortesTotal;
        const percentage = total > 0 ? (visited / total) * 100 : 0;

        return {
            visitedDoorsCount: visited,
            coveragePercentage: parseFloat(percentage.toFixed(2)), // Format to 2 decimal places
        };
    }, [portes, building]); // Recalculate when portes or building changes

    // NEW: Calculate if building is fully prospected
    const isBuildingFullyProspected = useMemo(() => {
        return coveragePercentage === 100;
    }, [coveragePercentage]);

    useEffect(() => {
        console.log("useEffect triggered. buildingId:", buildingId); // New log
        if (!buildingId) {
            console.warn("buildingId is undefined or null. Cannot fetch building details."); // New log
            setIsLoading(false);
            return;
        }
        if (!user?.id) { // <-- ADD THIS CHECK
            console.warn("User ID is not available. Cannot filter doors.");
            setIsLoading(false);
            return;
        }

        immeubleService.getImmeubleDetails(buildingId).then(details => {
            console.log("Immeuble details from API:", details);
            if (details) {
                setBuilding(details);
                if (details.portes && details.portes.length > 0) {
                    console.log("Details.portes from API:", details.portes);
                    // Filter doors by the current user's ID before mapping
                    const userPortes = details.portes.filter(p => p.assigneeId === user.id); // <-- ADD THIS FILTER
                    console.log("Filtered portes for current user:", userPortes);

                    const portesFromAPI = userPortes.map(p => ({
                        id: p.id,
                        numero: p.numeroPorte,
                        statut: p.statut as PorteStatus,
                        commentaire: p.commentaire || null,
                        passage: p.passage,
                    }));
                    setPortes(portesFromAPI);
                } else {
                    console.warn("No portes found for this building or details.portes is empty/null.");
                    setPortes([]);
                }
            } else {
                console.warn("Immeuble details object is null or undefined from API.");
                setBuilding(null);
            }
            setIsLoading(false);
        }).catch(error => {
            console.error("Error loading immeuble details:", error);
            setIsLoading(false);
        });
    }, [buildingId, user?.id]);

    const handleEdit = useCallback((doorId: string) => {
        console.log("handleEdit called for doorId:", doorId);
        const doorToEdit = portes.find(p => p.id === doorId);
        if (doorToEdit) {
            console.log("doorToEdit found:", doorToEdit);
            setEditingDoor(doorToEdit);
            setIsModalOpen(true);
        } else {
            console.log("doorToEdit not found for doorId:", doorId);
            console.log("Current portes array:", portes);
        }
    }, [portes]); // Dependency array: handleEdit depends on 'portes'

    const handleSaveDoor = async (updatedDoor: Porte) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await porteService.updatePorte(updatedDoor.id, {
                statut: updatedDoor.statut, // Use 'statut' as per Porte type
                commentaire: updatedDoor.commentaire,
                passage: updatedDoor.passage, // Use 'passage' as per Porte type
                assigneeId: user.id, // Include the commercial's ID
            });
            setPortes(portes.map(p => p.id === updatedDoor.id ? updatedDoor : p));
            setIsModalOpen(false);
            setEditingDoor(null);
        } catch (error) {
            setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
            console.error("Erreur lors de la mise à jour de la porte:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const columns = useMemo(() => createDoorsColumns(handleEdit, isBuildingFullyProspected), [handleEdit, isBuildingFullyProspected]); // Now depends on handleEdit

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
        <div className="container mx-auto py-8 p-4">
            <Button variant="outline" onClick={() => navigate(`/commercial/prospecting/setup/${buildingId}`)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour au choix du mode
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <Building className="h-6 w-6 text-primary" />
                        Prospection : {building.adresse}
                    </CardTitle>
                    <CardDescription>
                        Voici la liste des {building.nbPortesTotal} portes à prospecter. Mettez à jour leur statut au fur et à mesure.
                    </CardDescription>
                    <CardDescription className="mt-2 text-lg font-semibold">
                        Couverture: {visitedDoorsCount} / {building.nbPortesTotal} portes visitées ({coveragePercentage}%)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        title="Portes"
                        columns={columns}
                        data={portes}
                        filterColumnId="numero"
                        filterPlaceholder="Rechercher un n° de porte..."
                        isDeleteMode={false}
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                    />
                </CardContent>
            </Card>

            {editingDoor && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Éditer la Porte n°${editingDoor.numero}`}
                    maxWidth="sm:max-w-lg"
                >
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                            <Label htmlFor="statut">Statut</Label>
                            <Select
                                value={editingDoor.statut}
                                onValueChange={(value) => setEditingDoor({ ...editingDoor, statut: value as PorteStatus })}
                            >
                                <SelectTrigger id="statut">
                                    <SelectValue>
                                        {editingDoor.statut ? (
                                            <div className="flex items-center gap-2">
                                                <span className={cn("h-2 w-2 rounded-full", statusConfig[editingDoor.statut]?.className)} />
                                                <span>{editingDoor.statut}</span>
                                            </div>
                                        ) : (
                                            "Sélectionner un statut"
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {statusList.map((status) => {
                                        const config = statusConfig[status];
                                        const Icon = config.icon;
                                        return (
                                            <SelectItem key={status} value={status}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn("h-4 w-4", config.className)} />
                                                    <span>{status}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <Label htmlFor="commentaire">Commentaire</Label>
                            <Input
                                id="commentaire"
                                value={editingDoor.commentaire}
                                onChange={(e) => setEditingDoor({ ...editingDoor, commentaire: e.target.value })}
                                placeholder="Ajouter un commentaire..."
                            />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="repassage"
                                    checked={editingDoor.passage > 0} // Derived from passage
                                    onCheckedChange={(checked) => setEditingDoor({ ...editingDoor, passage: checked ? 1 : 0 })} // Update passage based on checkbox
                                />
                                <Label htmlFor="repassage" className="font-medium">À repasser</Label>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <Label htmlFor="passage" className="text-right">Passages</Label>
                                    <Input
                                        id="passage"
                                        type="number"
                                        min="0"
                                        value={editingDoor.passage}
                                        onChange={(e) => setEditingDoor({ ...editingDoor, passage: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full"
                                    />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit" onClick={() => handleSaveDoor(editingDoor)} className="bg-green-600 text-white hover:bg-green-700" disabled={isSaving}>
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                    {saveError && <p className="text-red-500 text-sm mt-2">{saveError}</p>}
                </Modal>
            )}
        </div>
    );
};

export default ProspectingDoorsPage;