// src/pages/commercial/doors-columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui-admin/button"
import { Badge } from "@/components/ui-admin/badge"
import { Edit, MessageSquare, Repeat, Hash, Check, BellOff, User, Smile, Frown, Landmark, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export type PorteStatus = "NON_VISITE" | "VISITE" | "ABSENT" | "REFUS" | "CURIEUX" | "RDV" | "CONTRAT_SIGNE";

export type Porte = {
  id: string; 
  numero: string;
  statut: PorteStatus;
  commentaire: string | null;
  passage: number;
};

export const statusConfig: Record<PorteStatus, { className: string; icon: React.ElementType }> = {
    "NON_VISITE": { className: "bg-gray-100 text-gray-800 border-gray-300", icon: BellOff },
    "VISITE": { className: "bg-blue-100 text-blue-800 border-blue-300", icon: Eye },
    "ABSENT": { className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: User },
    "CURIEUX": { className: "bg-purple-100 text-purple-800 border-purple-300", icon: Smile },
    "REFUS": { className: "bg-red-100 text-red-800 border-red-300", icon: Frown },
    "RDV": { className: "bg-sky-100 text-sky-800 border-sky-300", icon: Check },
    "CONTRAT_SIGNE": { className: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: Landmark },
};

export const statusList = (Object.keys(statusConfig) as PorteStatus[]).filter(
  (status) => status !== "VISITE"
);

export const createDoorsColumns = (
    onEdit: (porteId: string) => void,
    isBuildingFullyProspected: boolean
): ColumnDef<Porte>[] => [
    {
      accessorKey: "numero",
      header: "Porte",
      cell: ({ row }) => (
        <div className="font-bold flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground"/>
            {row.original.numero}
        </div>
      ),
      meta: { className: "w-[100px]" }
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut;
        const config = statusConfig[statut];
        return <Badge variant="outline" className={cn("font-medium", config.className)}><config.icon className="mr-1.5 h-3 w-3"/>{statut}</Badge>;
      }
    },
    {
        accessorKey: "passage",
        header: "Passages",
        cell: ({ row }) => {
            return <span>{row.original.passage}</span>
        }
    },
    {
        accessorKey: "repassage",
        header: "Repassage",
        cell: ({ row }) => {
            if (row.original.passage === 0) return <span className="text-muted-foreground">-</span>;
            return (
                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                    <Repeat className="h-4 w-4" />
                    <span>À revoir</span>
                </div>
            )
        }
    },
    {
      accessorKey: "commentaire",
      header: "Commentaire",
      cell: ({ row }) => {
        const commentaire = row.original.commentaire;
        if (!commentaire) return <span className="italic text-muted-foreground">Aucun commentaire</span>;
        return (
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            <span className="max-w-xs truncate">{commentaire}</span>
          </div>
        )
      },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(row.original.id)} disabled={isBuildingFullyProspected}>
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        )
    }
];