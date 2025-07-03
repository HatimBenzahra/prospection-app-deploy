// frontend-shadcn/src/pages/admin/immeubles/columns.tsx

"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom";
import { ArrowUpDown, Eye, User, MapPin, Percent, Users } from "lucide-react"
import { Button } from "@/components/ui-admin/button"
import { Badge } from "@/components/ui-admin/badge"
import { Checkbox } from "@/components/ui-admin/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-admin/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui-admin/avatar";

export type Immeuble = {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  status: "À visiter" | "Visité" | "RDV Pris" | "Inaccessible";
  nbPortes: number;
  nbPortesProspectees: number;
  prospectingMode: "Solo" | "Duo";
  prospectors: {
    id: string;
    nom: string;
    avatarFallback: string;
  }[];
  dateVisite: string | null;
  zone: string;
  zoneId: string;
  latlng: [number, number];
}

const Header = ({ title }: { title: string }) => (
  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
)

const SortableHeader = ({ title, column }: { title: string, column: any }) => (
  <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 h-8 hover:bg-transparent">
    <Header title={title} />
    <ArrowUpDown className="ml-2 h-3 w-3" />
  </Button>
)

const statusConfig = {
    "À visiter": "bg-blue-100 text-blue-800 border-blue-300",
    "Visité": "bg-gray-100 text-gray-800 border-gray-300",
    "RDV Pris": "bg-green-100 text-green-800 border-green-300",
    "Inaccessible": "bg-red-100 text-red-800 border-red-300",
};

export const createColumns = (
    isDeleteMode: boolean, 
    onFocusOnImmeuble: (immeuble: Immeuble) => void = () => {},
    onFocusOnZone: (zoneId: string) => void = () => {}
): ColumnDef<Immeuble>[] => [
    ...(isDeleteMode ? [{ 
        id: "select", 
        header: ({ table }: any) => (<Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />), 
        cell: ({ row }: any) => (<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" onClick={(e) => e.stopPropagation()} />), 
        enableSorting: false, enableHiding: false, 
    }] : []),

    {
      accessorKey: "adresse",
      header: ({ column }) => <SortableHeader title="Adresse" column={column} />,
      cell: ({ row }) => {
        const immeuble = row.original;
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onFocusOnImmeuble(immeuble); }}>
                  {immeuble.adresse}
                  <div className="text-xs text-muted-foreground">{`${immeuble.codePostal} ${immeuble.ville}`}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Cliquer pour voir sur la carte</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader title="Statut" column={column} />,
      cell: ({ row }) => <Badge variant="outline" className={statusConfig[row.original.status]}>{row.original.status}</Badge>
    },
    {
        id: "couverture",
        header: ({ column }) => <SortableHeader title="Couverture" column={column} />,
        cell: ({ row }) => {
            const { nbPortes, nbPortesProspectees } = row.original;
            if (nbPortes === 0) return <span className="text-muted-foreground">N/A</span>;
            const percentage = (nbPortesProspectees / nbPortes) * 100;
            return (
                <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{percentage.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">({nbPortesProspectees}/{nbPortes})</span>
                </div>
            )
        },
        sortingFn: (rowA, rowB) => {
            const percA = rowA.original.nbPortes > 0 ? (rowA.original.nbPortesProspectees / rowA.original.nbPortes) : -1;
            const percB = rowB.original.nbPortes > 0 ? (rowB.original.nbPortesProspectees / rowB.original.nbPortes) : -1;
            return percA - percB;
        }
    },
    {
        accessorKey: "zone",
        header: ({ column }) => <SortableHeader title="Zone" column={column} />,
        cell: ({ row }) => (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onFocusOnZone(row.original.zoneId); }} >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{row.original.zone}</span>
                  </div>
              </TooltipTrigger>
              <TooltipContent><p>Cliquer pour voir la zone sur la carte</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
    },
    {
        accessorKey: "prospectingMode",
        header: ({ column }) => <SortableHeader title="Mode" column={column} />,
        cell: ({ row }) => {
            const { prospectingMode, prospectors } = row.original;
            if (prospectors.length === 0) {
                return <span className="text-muted-foreground">-</span>;
            }
            const Icon = prospectingMode === 'Duo' ? Users : User;
            return (
                <Badge variant="secondary" className="font-medium">
                    <Icon className="h-3 w-3 mr-1.5" />
                    {prospectingMode}
                </Badge>
            );
        }
    },
    {
        accessorKey: "prospectors",
        header: ({ column }) => <SortableHeader title="Prospecteurs" column={column} />,
        cell: ({ row }) => {
            const { prospectors } = row.original;
            if (!prospectors || prospectors.length === 0) {
                return <span className="text-muted-foreground">N/A</span>;
            }
            return (
                <div className="flex items-center">
                    <div className="flex -space-x-2">
                        {prospectors.map(p => (
                            <TooltipProvider key={p.id} delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to={`/admin/commerciaux/${p.id}`} onClick={(e) => e.stopPropagation()} className="hover:z-10">
                                            <Avatar className="h-8 w-8 border-2 border-white">
                                                <AvatarFallback>{p.avatarFallback}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{p.nom}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>
            );
        },
        sortingFn: (rowA, rowB) => {
            const nameA = rowA.original.prospectors[0]?.nom || '';
            const nameB = rowB.original.prospectors[0]?.nom || '';
            return nameA.localeCompare(nameB);
        }
    },
    {
        id: "actions",
        header: () => <div className="text-right"><Header title="Actions" /></div>,
        cell: ({ row }) => {
            const immeuble = row.original;
            return ( <div className="text-right"><Button asChild variant="ghost" className="h-8 w-8 p-0 cursor-pointer"><Link to={`/admin/immeubles/${immeuble.id}`} onClick={(e) => e.stopPropagation()}><Eye className="h-4 w-4" /><span className="sr-only">Voir les détails de l'immeuble</span></Link></Button></div> )
        },
    },
]