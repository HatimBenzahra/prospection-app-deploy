// src/pages/commercial/SelectBuildingPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui-admin/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { ArrowRight, Building } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { immeubleService, type ImmeubleFromApi } from '@/services/immeuble.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui-admin/skeleton';

// Création des colonnes pour la DataTable
const createBuildingColumns = (setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>): ColumnDef<ImmeubleFromApi>[] => [
  {
    id: 'select',
    header: () => null,
    cell: ({ row }) => (
      <input
        type="radio"
        name="select-building"
        checked={row.getIsSelected()}
        onChange={() => setRowSelection({ [row.id]: true })}
        className="h-4 w-4 accent-primary"
      />
    ),
  },
  {
    accessorKey: 'adresse',
    header: 'Adresse',
    cell: ({ row }) => (
      <div>
        <div className="font-bold">{row.original.adresse}</div>
        <div className="text-sm text-muted-foreground">{`${row.original.codePostal} ${row.original.ville}`}</div>
      </div>
    ),
  },
  {
    accessorKey: 'nbPortesTotal',
    header: () => <div className="text-center">Portes</div>,
    cell: ({ row }) => <div className="text-center">{row.original.nbPortesTotal}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: () => <div className="text-right">Ajouté le</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {format(new Date(row.original.createdAt), "d MMM yyyy", { locale: fr })}
      </div>
    ),
  },
];

const PageSkeleton = () => (
    <Card className="max-w-4xl mx-auto">
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

const SelectBuildingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allImmeubles, setAllImmeubles] = useState<ImmeubleFromApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    
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

    const columns = useMemo(() => createBuildingColumns(setRowSelection), []);

    const displayedImmeubles = useMemo(() => allImmeubles.slice(0, 3), [allImmeubles]);

    const selectedBuildingId = useMemo(() => {
        const selectedRowId = Object.keys(rowSelection)[0];
        if (selectedRowId) {
            const selectedRow = allImmeubles.find(imm => imm.id === displayedImmeubles[parseInt(selectedRowId, 10)]?.id);
            return selectedRow?.id;
        }
        return undefined;
    }, [rowSelection, allImmeubles, displayedImmeubles]);


    const handleNext = () => {
        if (selectedBuildingId) {
            navigate(`/commercial/prospecting/setup/${selectedBuildingId}`);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8 p-4"><PageSkeleton /></div>;
    }

    return (
        <div className="container mx-auto py-8 p-4">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <Building className="h-6 w-6 text-primary"/>
                        Étape 1 : Sélection de l'immeuble
                    </CardTitle>
                    <CardDescription>
                        Choisissez l'immeuble que vous souhaitez prospecter. Les 3 plus récents sont affichés. Utilisez la recherche pour en trouver d'autres.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        title="Immeubles"
                        columns={columns}
                        data={displayedImmeubles}
                        filterColumnId="adresse"
                        filterPlaceholder="Rechercher une adresse..."
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                        isDeleteMode={false}
                        onAddEntity={() => {}}
                        onConfirmDelete={() => {}}
                        onToggleDeleteMode={() => {}}
                        fullData={allImmeubles}
                    />
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