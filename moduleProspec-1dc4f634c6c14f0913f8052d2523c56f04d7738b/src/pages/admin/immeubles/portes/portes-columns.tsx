// frontend-shadcn/src/pages/admin/immeubles/portes/portes-columns.tsx

"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui-admin/badge"
import { ArrowUpDown, Hash, MessageSquare, Repeat, Check, BellOff, User, Smile, Frown, Landmark, Eye } from "lucide-react"
import { Button } from "@/components/ui-admin/button"
import { cn } from "@/lib/utils"

// --- 1. MISE À JOUR DU TYPE Porte avec les nouveaux statuts ---
export type PorteStatus = "NON_VISITE" | "VISITE" | "ABSENT" | "REFUS" | "CURIEUX" | "RDV" | "CONTRAT_SIGNE";

export type Porte = {
  id: string
  numeroPorte: string
  statut: PorteStatus
  passage: number
  commentaire: string | null
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
export const statusConfig: Record<PorteStatus, { className: string; icon: React.ElementType }> = {
    "NON_VISITE": { className: "bg-gray-100 text-gray-800 border-gray-300", icon: BellOff },
    "VISITE": { className: "bg-blue-100 text-blue-800 border-blue-300", icon: Eye },
    "ABSENT": { className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: User },
    "REFUS": { className: "bg-red-100 text-red-800 border-red-300", icon: Frown },
    "CURIEUX": { className: "bg-purple-100 text-purple-800 border-purple-300", icon: Smile },
    "RDV": { className: "bg-sky-100 text-sky-800 border-sky-300", icon: Check },
    "CONTRAT_SIGNE": { className: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: Landmark },
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
        const config = statusConfig[statut];
        return <Badge variant="outline" className={cn("font-medium", config.className)}><config.icon className="mr-1.5 h-3 w-3"/>{statut}</Badge>;
      }
    },
    {
      accessorKey: "passage",
      header: ({ column }) => <SortableHeader title="Passage" column={column} />,
      cell: ({ row }) => {
        const { statut, passage } = row.original;
        
        // --- 3. MISE À JOUR de la logique de repassage ---
        const isRepassageApplicable = statut === 'ABSENT' || statut === 'CURIEUX' || statut === 'RDV' || passage > 0;

        if (!isRepassageApplicable) {
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