// frontend-shadcn/src/pages/admin/immeubles/portes/portes-columns.tsx

"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui-admin/badge"
import { ArrowUpDown, Hash, MessageSquare, Repeat } from "lucide-react"
import { Button } from "@/components/ui-admin/button"

// --- 1. MISE À JOUR DU TYPE Porte avec les nouveaux statuts ---
export type Porte = {
  id: string
  numeroPorte: string
  statut: "Non visité" | "Visité" | "Absent" | "Refus" | "Curieux" | "Contrat signé"
  passage: number
  commentaire: string
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

// --- 2. MISE À JOUR de la configuration des couleurs des badges ---
const statusConfig = {
    "Non visité": "bg-gray-100 text-gray-800 border-gray-300",
    "Visité": "bg-blue-100 text-blue-800 border-blue-300",
    "Absent": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Refus": "bg-red-100 text-red-800 border-red-300",
    "Curieux": "bg-purple-100 text-purple-800 border-purple-300",
    "Contrat signé": "bg-green-100 text-green-800 border-green-300",
};

export const createPortesColumns = (): ColumnDef<Porte>[] => [
    {
      accessorKey: "numeroPorte",
      header: ({ column }) => <SortableHeader title="Porte" column={column} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.numeroPorte}</span>
        </div>
      ),
      meta: { className: "w-[120px]" },
    },
    {
      accessorKey: "statut",
      header: ({ column }) => <SortableHeader title="Statut" column={column} />,
      cell: ({ row }) => {
        const statut = row.original.statut;
        return <Badge variant="outline" className={statusConfig[statut]}>{statut}</Badge>
      }
    },
    {
      accessorKey: "passage",
      header: ({ column }) => <SortableHeader title="Passage" column={column} />,
      cell: ({ row }) => {
        const { statut, passage } = row.original;
        
        // --- 3. MISE À JOUR de la logique de repassage ---
        // Le repassage est applicable pour "Absent" et "Curieux".
        const isRepassageApplicable = statut === 'Absent' || statut === 'Curieux';

        if (!isRepassageApplicable || passage === 0) {
            return <span className="text-muted-foreground">-</span>;
        }

        return (
            <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>{`Passage n°${passage}`}</span>
            </div>
        );
      }
    },
    {
      accessorKey: "commentaire",
      header: () => <Header title="Commentaire" />,
      cell: ({ row }) => {
        const commentaire = row.original.commentaire;
        if (!commentaire) return <span className="text-muted-foreground italic">Aucun</span>;
        return (
            <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <span className="max-w-xs truncate">{commentaire}</span>
            </div>
        )
      },
    },
]