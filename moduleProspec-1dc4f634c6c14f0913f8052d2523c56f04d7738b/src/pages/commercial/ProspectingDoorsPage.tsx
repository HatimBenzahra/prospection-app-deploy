// src/pages/commercial/ProspectingDoorsPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { DataTable } from '@/components/data-table/DataTable';
import { createDoorsColumns, type Porte } from './doors-columns';
import { ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';

// --- DÉBUT DE LA CORRECTION ---
// On définit ici une base de données simulée pour cette page.
// IMPORTANT : Ces données doivent être IDENTIQUES à celles de la page de sélection.
type BuildingDetails = {
  id: string;
  adresse: string;
  nbPortes: number;
};

const MOCK_BUILDINGS_DATABASE: BuildingDetails[] = [
  { id: 'imm-1', adresse: '10 Rue de la Paix', nbPortes: 25 },
  { id: 'imm-2', adresse: '25 Bd des Capucines', nbPortes: 40 },
  { id: 'imm-3', adresse: '15 Av. des Champs-Élysées', nbPortes: 60 },
];

// La fonction recherche maintenant dans la base de données simulée de cette page.
const getBuildingDetails = async (id: string | undefined): Promise<BuildingDetails | null> => {
    if (!id) return null;
    console.log(`Recherche de l'immeuble ${id} dans la BDD simulée...`);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    const building = MOCK_BUILDINGS_DATABASE.find(b => b.id === id);
    
    return building || null;
};
// --- FIN DE LA CORRECTION ---


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
    const [building, setBuilding] = useState<BuildingDetails | null>(null);
    const [portes, setPortes] = useState<Porte[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getBuildingDetails(buildingId).then(details => {
            if (details) {
                setBuilding(details);
                const initialPortes = Array.from({ length: details.nbPortes }, (_, i) => ({
                    id: `${buildingId}-porte-${i + 1}`, 
                    numero: String(i + 1),
                    statut: "Non visité" as const,
                    commentaire: "",
                    repassage: false,
                }));
                setPortes(initialPortes);
            }
            setIsLoading(false);
        });
    }, [buildingId]);

    const handleEdit = (porteNumero: string) => {
        alert(`Éditer la porte n°${porteNumero}`);
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
                        Voici la liste des {building.nbPortes} portes à prospecter. Mettez à jour leur statut au fur et à mesure.
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
        </div>
    );
};

export default ProspectingDoorsPage;