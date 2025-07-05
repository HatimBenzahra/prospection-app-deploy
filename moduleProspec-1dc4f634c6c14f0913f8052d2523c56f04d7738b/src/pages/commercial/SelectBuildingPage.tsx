// src/pages/commercial/SelectBuildingPage.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui-admin/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui-admin/card';
import { ArrowRight, Building} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type pour les données de la table
export type BuildingData = {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  nbPortes: number;
  dateAjout: Date;
};

// Données simulées pour les immeubles
const MOCK_BUILDINGS: BuildingData[] = [
  { id: 'imm-1', adresse: '10 Rue de la Paix', ville: 'Paris', codePostal: '75002', nbPortes: 25, dateAjout: new Date('2025-06-30') },
  { id: 'imm-2', adresse: '25 Bd des Capucines', ville: 'Paris', codePostal: '75009', nbPortes: 40, dateAjout: new Date('2025-06-28') },
  { id: 'imm-3', adresse: '15 Av. des Champs-Élysées', ville: 'Paris', codePostal: '75008', nbPortes: 60, dateAjout: new Date('2025-06-25') },
];

// Création des colonnes pour la DataTable
const createBuildingColumns = (setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>): ColumnDef<BuildingData>[] => [
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
    accessorKey: 'nbPortes',
    header: () => <div className="text-center">Portes</div>,
    cell: ({ row }) => <div className="text-center">{row.original.nbPortes}</div>,
  },
  {
    accessorKey: 'dateAjout',
    header: () => <div className="text-right">Ajouté le</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {format(row.original.dateAjout, "d MMM yyyy", { locale: fr })}
      </div>
    ),
  },
];

const SelectBuildingPage = () => {
    const navigate = useNavigate();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    
    const sortedBuildings = useMemo(() => 
        [...MOCK_BUILDINGS].sort((a, b) => b.dateAjout.getTime() - a.dateAjout.getTime()), 
        []
    );

    const columns = useMemo(() => createBuildingColumns(setRowSelection), []);

    const selectedBuildingId = Object.keys(rowSelection).length > 0 ? sortedBuildings[parseInt(Object.keys(rowSelection)[0])].id : undefined;

    const handleNext = () => {
        if (selectedBuildingId) {
            console.log(`Navigating from SelectBuildingPage with ID: ${selectedBuildingId}`);
            navigate(`/commercial/prospecting/setup/${selectedBuildingId}`);
        }
    };

    return (
        <div className="container mx-auto py-8">
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
                    <DataTable
                        title="Immeubles"
                        columns={columns}
                        data={sortedBuildings}
                        filterColumnId="adresse"
                        filterPlaceholder="Rechercher une adresse..."
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                        isDeleteMode={false}
                        onAddEntity={() => {}}
                        onConfirmDelete={() => {}}
                        onToggleDeleteMode={() => {}}
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