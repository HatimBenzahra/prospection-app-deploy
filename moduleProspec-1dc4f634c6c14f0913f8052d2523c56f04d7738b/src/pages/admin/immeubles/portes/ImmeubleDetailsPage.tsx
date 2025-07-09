// frontend-shadcn/src/pages/admin/immeubles/portes/ImmeubleDetailsPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, Building, Users, Check, MoveUpRight, KeyRound 
} from 'lucide-react';

import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui-admin/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { DataTable } from '@/components/data-table/DataTable';
import type { Porte } from './portes-columns';
import { createPortesColumns } from './portes-columns';
import { GenericRadialBarChart } from '@/components/ui-admin/GenericRadialBarChart';
import { immeubleService } from '@/services/immeuble.service';

// Types locaux pour la clarté du composant
interface Prospector {
    id: string;
    nom: string;
}

interface ImmeubleDetails {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  prospectors: Prospector[];
  prospectingMode: 'SOLO' | 'DUO';
  hasElevator: boolean;
  digicode: string | null;
  nbPortesTotal: number;
  portes: Porte[];
  stats: {
    contratsSignes: number;
    rdvPris: number;
  };
}

// --- Composants UI ---
const ProspectorBadge = ({ Icon, label, prospectors }: { Icon: React.ElementType, label: string, prospectors: Prospector[] }) => (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 h-full">
        <div className="bg-muted p-2 rounded-md"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <div className="flex flex-col gap-1.5">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-base font-semibold flex flex-col items-start">
                {prospectors.map(p => (
                    <Link key={p.id} to={`/admin/commerciaux/${p.id}`} className="hover:underline hover:text-primary">
                        {p.nom}
                    </Link>
                ))}
            </div>
        </div>
    </div>
);

const InfoBadge = ({ Icon, label, value }: { Icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 h-full">
        <div className="bg-muted p-2 rounded-md"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-base font-semibold">{value}</div>
        </div>
    </div>
);


const ImmeubleDetailsPage = () => {
    const { immeubleId } = useParams<{ immeubleId: string }>();
    const navigate = useNavigate();
    const [immeuble, setImmeuble] = useState<ImmeubleDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // NEW: Calculate building-specific stats from portes array
    const buildingStats = useMemo(() => {
        if (!immeuble || !immeuble.portes) {
            return { contratsSignes: 0, rdvPris: 0 };
        }

        const contratsSignes = immeuble.portes.filter(p => p.statut === "CONTRAT_SIGNE").length;
        const rdvPris = immeuble.portes.filter(p => p.statut === "RDV").length;

        return { contratsSignes, rdvPris };
    }, [immeuble]); // Recalculate when immeuble (and thus its portes) changes

    useEffect(() => {
        if (immeubleId) {
            fetchData(immeubleId);
        }
    }, [immeubleId]);

    const fetchData = async (id: string) => {
        setLoading(true);
        try {
            const detailsFromApi = await immeubleService.getImmeubleDetails(id);

            const formattedDetails: ImmeubleDetails = {
                id: detailsFromApi.id,
                adresse: detailsFromApi.adresse,
                ville: detailsFromApi.ville,
                codePostal: detailsFromApi.codePostal,
                prospectors: (detailsFromApi.prospectors || []).map(p => ({
                    id: p.id,
                    nom: `${p.prenom} ${p.nom}`
                })),
                prospectingMode: detailsFromApi.prospectingMode,
                hasElevator: detailsFromApi.hasElevator,
                digicode: detailsFromApi.digicode,
                nbPortesTotal: detailsFromApi.nbPortesTotal,
                portes: (detailsFromApi.portes || []).map(p => {
                    console.log("Raw p.statut from API:", p.statut);
                    return {
                        id: p.id,
                        numeroPorte: p.numeroPorte,
                        statut: p.statut, // Directly use status from API
                        passage: p.passage,
                        commentaire: p.commentaire || null, // Map to null if empty
                    }
                }),
                stats: detailsFromApi.stats,
            };
            setImmeuble(formattedDetails);
        } catch (error) {
            console.error("Erreur de chargement des détails:", error);
            setImmeuble(null);
        } finally {
            setLoading(false);
        }
    };

    const portesData = useMemo(() => {
        if (!immeuble) return [];
        const visitesMap = new Map(immeuble.portes.map(p => [p.numeroPorte, p]));
        const allPortes: Porte[] = [];
        for (let i = 1; i <= immeuble.nbPortesTotal; i++) {
            const numeroPorteStr = `Porte ${i}`; // Match API format
            if (immeuble.prospectingMode === 'DUO' && i % 2 !== 0) continue;

            const visiteExistante = visitesMap.get(numeroPorteStr);
            if (visiteExistante) {
                allPortes.push({ ...visiteExistante });
            } else {
                allPortes.push({ id: `porte-non-visitee-${i}`, numeroPorte: numeroPorteStr, statut: 'NON_VISITE', passage: 0, commentaire: "" });
            }
        }
        return allPortes;
    }, [immeuble]);

    const portesColumns = useMemo(() => createPortesColumns(), []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-40 w-full" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-96" />
                    <Skeleton className="lg:col-span-1 h-96" />
                </div>
            </div>
        )
    }
    
    if (!immeuble) {
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold">Immeuble non trouvé</h2>
            <p className="text-muted-foreground mt-2">Les détails pour cet immeuble n'ont pas pu être chargés.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
          </div>
        );
    }

    const portesProspectees = portesData.filter(p => p.statut !== "NON_VISITE").length;
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4"> 
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste des immeubles
                </Button>
                <Button variant="outline" onClick={() => fetchData(immeubleId)} disabled={loading}> 
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser les données
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Building className="h-6 w-6" />
                        {immeuble.adresse}, {immeuble.codePostal} {immeuble.ville}
                    </CardTitle>
                    <CardDescription>Détails et informations sur la prospection de cet immeuble.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <ProspectorBadge Icon={Users} label={immeuble.prospectingMode === 'DUO' ? "Duo de Prospection" : "Prospecteur"} prospectors={immeuble.prospectors} />
                   <InfoBadge Icon={Check} label="Contrats Signés" value={buildingStats.contratsSignes} />
                   <InfoBadge Icon={MoveUpRight} label="RDV Pris" value={buildingStats.rdvPris} />
                   <InfoBadge Icon={KeyRound} label="Digicode" value={immeuble.digicode || "Aucun"} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DataTable
                        columns={portesColumns}
                        data={portesData}
                        title="Détail des Portes"
                        filterColumnId="numeroPorte"
                        filterPlaceholder="Filtrer par n° de porte..."
                        isDeleteMode={false}
                        onToggleDeleteMode={() => {}}
                        rowSelection={{}}
                        setRowSelection={() => {}}
                        onConfirmDelete={() => {}}
                    />
                </div>
                <div className="lg:col-span-1">
                    <GenericRadialBarChart
                        title="Taux de Couverture"
                        value={portesProspectees}
                        total={immeuble.nbPortesTotal}
                        color="fill-sky-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImmeubleDetailsPage;