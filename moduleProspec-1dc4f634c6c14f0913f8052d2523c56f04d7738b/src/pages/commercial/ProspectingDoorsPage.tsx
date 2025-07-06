// src/pages/commercial/ProspectingDoorsPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { DataTable } from '@/components/data-table/DataTable';
import { createDoorsColumns, type Porte, statusConfig, statusList, type PorteStatus } from './doors-columns';
import { ArrowLeft, Building } from 'lucide-react';
import { Input } from '@/components/ui-admin/input';
import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui-admin/dialog';
import { Label } from '@/components/ui-admin/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { Checkbox } from '@/components/ui-admin/checkbox';
import { immeubleService, type ImmeubleDetailsFromApi } from '@/services/immeuble.service';
import { porteService } from '@/services/porte.service';
import { cn } from '@/lib/utils';


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
    const navigate = useNavigate();
    const [building, setBuilding] = useState<ImmeubleDetailsFromApi | null>(null);
    const [portes, setPortes] = useState<Porte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoor, setEditingDoor] = useState<Porte | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!buildingId) return;
        immeubleService.getImmeubleDetails(buildingId).then(details => {
            if (details) {
                setBuilding(details);
                const portesFromAPI = details.portes.map(p => ({
                    id: p.id,
                    numero: p.numeroPorte,
                    statut: p.statut as PorteStatus,
                    commentaire: p.commentaire || "",
                    repassage: p.passage > 0, // Ou une autre logique si nécessaire
                    passage: p.passage,
                    nbPassages: p.nbPassages,
                }));
                setPortes(portesFromAPI);
            }
            setIsLoading(false);
        }).catch(error => {
            console.error("Erreur lors du chargement des détails de l'immeuble:", error);
            setIsLoading(false);
        });
    }, [buildingId]);

    const handleEdit = (doorId: string) => {
        const doorToEdit = portes.find(p => p.id === doorId);
        if (doorToEdit) {
            setEditingDoor(doorToEdit);
            setIsModalOpen(true);
        }
    };

    const handleSaveDoor = async (updatedDoor: Porte) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await porteService.updatePorte(updatedDoor.id, {
                status: updatedDoor.statut,
                commentaire: updatedDoor.commentaire,
                nbPassages: updatedDoor.nbPassages,
                repassage: updatedDoor.repassage,
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

    const columns = useMemo(() => createDoorsColumns(handleEdit), []);

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
        <div className="container mx-auto py-8">
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
                </CardHeader>
                <CardContent>
                    <DataTable
                        title="Portes"
                        columns={columns}
                        data={portes}
                        filterColumnId="numero"
                        filterPlaceholder="Rechercher un n° de porte..."
                        isDeleteMode={false}
                        onAddEntity={() => {}}
                        onConfirmDelete={() => {}}
                        onToggleDeleteMode={() => {}}
                        rowSelection={{}}
                        setRowSelection={() => {}}
                    />
                </CardContent>
            </Card>

            {editingDoor && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px] bg-white">
                        <DialogHeader>
                            <DialogTitle>Éditer la Porte n°{editingDoor.numero}</DialogTitle>
                            <CardDescription>
                                Mettez à jour les informations de cette porte.
                            </CardDescription>
                        </DialogHeader>
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
                                        checked={editingDoor.repassage}
                                        onCheckedChange={(checked) => setEditingDoor({ ...editingDoor, repassage: checked as boolean })}
                                    />
                                    <Label htmlFor="repassage" className="font-medium">À repasser</Label>
                                </div>
                                <div className="grid grid-cols-2 items-center gap-2">
                                    <Label htmlFor="nbPassages" className="text-right">Passages</Label>
                                    <Input
                                        id="nbPassages"
                                        type="number"
                                        min="0"
                                        value={editingDoor.nbPassages}
                                        onChange={(e) => setEditingDoor({ ...editingDoor, nbPassages: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" className="bg-gray-200 text-black hover:bg-gray-300">Annuler</Button>
                            </DialogClose>
                            <Button type="submit" onClick={() => handleSaveDoor(editingDoor)} className="bg-green-600 text-white hover:bg-green-700" disabled={isSaving}>
                                {isSaving ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                        {saveError && <p className="text-red-500 text-sm mt-2">{saveError}</p>}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default ProspectingDoorsPage;