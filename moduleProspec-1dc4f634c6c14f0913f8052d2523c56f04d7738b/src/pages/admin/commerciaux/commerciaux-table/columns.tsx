// frontend-shadcn/src/pages/admin/commerciaux/commerciaux-table/columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { ArrowUpDown, Mail, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui-admin/button"
import { Badge } from "@/components/ui-admin/badge"
import { Checkbox } from "@/components/ui-admin/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui-admin/tooltip"

export type Commercial = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  manager: string;
  managerId: string;
  equipe: string;
  equipeId?: string;
  classement: number;
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

export const createColumns = (isDeleteMode: boolean, onEdit: (commercial: Commercial) => void, managerIdForBack?: string): ColumnDef<Commercial>[] => {
  const columns: ColumnDef<Commercial>[] = [
    // --- Colonne de sélection ---
    ...(isDeleteMode ? [{
      id: "select",
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }] : []),

    // --- Colonnes de données ---
    {
      accessorKey: "nom",
      header: ({ column }) => <SortableHeader title="Nom" column={column} />,
      cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("nom")}</div>,
    },
    {
      accessorKey: "prenom",
      header: () => <Header title="Prénom" />,
    },
    {
      accessorKey: "email",
      header: () => <Header title="Email" />,
      cell: ({ row }) => (
        <a href={`mailto:${row.getValue("email")}`} className="flex items-center gap-2 hover:underline">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.getValue("email")}
        </a>
      )
    },
    {
      accessorKey: "manager",
      header: () => <Header title="Manager" />,
      cell: ({ row }) => {
        const managerName = row.original.manager;
        const managerId = row.original.managerId;
        return (
            <Link 
                to={`/admin/managers/${managerId}`} 
                className="hover:underline hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                {managerName}
            </Link>
        )
      },
    },
    {
      accessorKey: "equipe",
      header: () => <Header title="Équipe" />,
    },
    {
      accessorKey: "classement",
      header: ({ column }) => <div className="flex justify-center"><SortableHeader title="Classement" column={column} /></div>,
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const classement = row.getValue("classement") as number;
        // CORRECTION: Rétablissement des couleurs des badges
        let badgeClass = "";
        if (classement === 1) badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200/80";
        else if (classement === 2) badgeClass = "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300/80";
        else if (classement === 3) badgeClass = "bg-orange-200 text-orange-800 border-orange-300 hover:bg-orange-300/80";
        else badgeClass = "bg-gray-100 text-gray-800 border-gray-300";
        
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={badgeClass}>{classement}</Badge>
          </div>
        );
      },
    },

    // --- Colonne d'Actions (améliorée) ---
    {
        id: "actions",
        header: () => <div className="text-right"><Header title="Actions" /></div>,
        cell: ({ row }) => {
            const commercial = row.original;
            return (
                // CORRECTION: Utilisation d'un TooltipProvider et ajout d'espace
                <TooltipProvider delayDuration={100}>
                    <div className="text-right space-x-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" className="h-8 w-8 p-0">
                                    <Link to={`/admin/commerciaux/${commercial.id}`} state={{ fromManager: managerIdForBack }} onClick={(e) => { e.stopPropagation(); }}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Voir les détails</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Voir les détails</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(commercial); }}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Modifier</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Modifier</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            )
        },
    },
  ]
  
  return columns;
}