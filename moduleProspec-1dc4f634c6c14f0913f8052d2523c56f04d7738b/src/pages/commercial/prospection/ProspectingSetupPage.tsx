// src/pages/commercial/ProspectingSetupPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui-admin/card';
import { Button } from '@/components/ui-admin/button';
import { Label } from '@/components/ui-admin/label';
import { User, Users, ArrowRight, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { useAuth } from '@/contexts/AuthContext';
import { commercialService, type CommercialFromAPI } from '@/services/commercial.service';
import { prospectionService } from '@/services/prospection.service';
import { immeubleService, type ImmeubleDetailsFromApi } from '@/services/immeuble.service';
import { toast } from 'sonner';
import { Modal } from '@/components/ui-admin/Modal';
import axios from 'axios';

type ProspectingMode = 'solo' | 'duo';

const ProspectingSetupPage = () => {
    const { buildingId } = useParams<{ buildingId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mode, setMode] = useState<ProspectingMode | null>(null);
    const [commercials, setCommercials] = useState<CommercialFromAPI[]>([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [isLoadingCommercials, setIsLoadingCommercials] = useState(true);
    const [isSendingInvitation, setIsSendingInvitation] = useState(false);
    const [sentRequestId, setSentRequestId] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const fetchCommercials = async () => {
            try {
                const data = await commercialService.getCommerciaux();
                // Filter out the current user from the list of potential partners
                setCommercials(data.filter(c => c.id !== user?.id));
            } catch (error) {
                toast.error("Erreur lors du chargement des commerciaux.");
                console.error("Error fetching commercials:", error);
            } finally {
                setIsLoadingCommercials(false);
            }
        };
        fetchCommercials();
    }, [user]);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (sentRequestId && isSendingInvitation) {
            console.log(`Polling for request status for ID: ${sentRequestId}`);
            interval = setInterval(async () => {
                try {
                    const response = await prospectionService.getRequestStatus(sentRequestId);
                    console.log(`Polled status for ${sentRequestId}:`, response?.status);

                    if (!response) { // Request not found (e.g., deleted or already handled and removed)
                        clearInterval(interval);
                        setIsSendingInvitation(false);
                        setSentRequestId(null);
                        toast.info("L'invitation a été traitée ou n'existe plus.");
                    } else if (response.status !== 'PENDING') {
                        clearInterval(interval);
                        setIsSendingInvitation(false);
                        setSentRequestId(null);
                        if (response.status === 'ACCEPTED') {
                            toast.success("Votre invitation a été acceptée ! Redirection vers la prospection...");
                            navigate(`/commercial/prospecting/doors/${buildingId}`);
                        } else if (response.status === 'REFUSED') {
                            toast.info("Votre invitation a été refusée.");
                        }
                    }
                } catch (error) {
                    console.error("Error polling request status:", error);
                    clearInterval(interval);
                    setIsSendingInvitation(false);
                    setSentRequestId(null);
                    toast.error("Erreur lors de la vérification du statut de l'invitation.");
                }
            }, 2000); // Poll every 2 seconds
        }
        return () => { if (interval) clearInterval(interval); };
    }, [sentRequestId, isSendingInvitation, navigate, buildingId]);

    const handleStartSolo = async () => {
        if (!user?.id || !buildingId) return;
        try {
            const immeubleDetails = await immeubleService.getImmeubleDetails(buildingId);
            if (immeubleDetails && immeubleDetails.portes && immeubleDetails.portes.length > 0) {
                // Doors already exist, navigate directly to doors page
                toast.info("Reprise de la prospection existante.");
                navigate(`/commercial/prospecting/doors/${buildingId}`);
            } else {
                // No doors exist, proceed with starting new prospection
                await prospectionService.startProspection({
                    commercialId: user.id,
                    immeubleId: buildingId,
                    mode: 'SOLO',
                });
                toast.success("Prospection solo démarrée !");
                navigate(`/commercial/prospecting/doors/${buildingId}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors du démarrage de la prospection solo.");
            console.error("Error starting solo prospection:", error);
        }
    };

    const handleStartDuo = async () => {
        // Validation améliorée pour des messages d'erreur plus spécifiques
        if (!user || !user.id) {
            toast.error("Votre ID utilisateur est manquant. Veuillez vous reconnecter.");
            return;
        }
        if (!buildingId) {
            toast.error("L'ID de l'immeuble est manquant dans l'URL. Veuillez vérifier l'adresse.");
            return;
        }
        if (!selectedPartnerId) {
            toast.error("Veuillez sélectionner un coéquipier pour le mode duo.");
            return;
        }

        console.log("Setting isSendingInvitation to true");
        setIsSendingInvitation(true);
        abortControllerRef.current = new AbortController();

        try {
            const duoDto = {
                commercialId: user.id,
                immeubleId: buildingId,
                mode: 'DUO' as const, // Ajout de 'as const' pour une meilleure inférence de type
                partnerId: selectedPartnerId,
            };
            // Le console.log que nous avons ajouté précédemment est toujours là pour une vérification visuelle
            console.log("Sending duo prospection DTO:", duoDto);

            const response = await prospectionService.startProspection(duoDto, abortControllerRef.current.signal);
            setSentRequestId(response.requestId); // Capture l'ID de la requête
            toast.success("Invitation de prospection duo envoyée !");
            // Pas de navigation ici, la modale de chargement se fermera
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.info("Envoi de l'invitation annulé.");
            } else {
                toast.error(error.response?.data?.message || "Erreur lors de l'envoi de l'invitation duo.");
                console.error("Error sending duo invitation:", error);
            }
        } finally {
            abortControllerRef.current = null;
        }
    };

    const handleCancelInvitation = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSendingInvitation(false);
    };

    return (
        <div className="container mx-auto py-8 p-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary"/>
                        Étape 2 : Mode de Prospection
                    </CardTitle>
                    <CardDescription>
                        Allez-vous prospecter seul ou en équipe aujourd'hui ?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card 
                            onClick={() => setMode('solo')}
                            className={cn(
                                "p-6 text-center cursor-pointer transition-all border-2",
                                mode === 'solo' ? 'border-primary shadow-lg scale-105' : 'hover:border-primary/50'
                            )}
                        >
                            <User className="mx-auto h-12 w-12 text-primary" />
                            <h3 className="mt-4 text-lg font-bold">Mode Solo</h3>
                            <p className="text-sm text-muted-foreground">Prospectez seul à votre rythme.</p>
                        </Card>
                        <Card 
                            onClick={() => setMode('duo')}
                            className={cn(
                                "p-6 text-center cursor-pointer transition-all border-2",
                                mode === 'duo' ? 'border-primary shadow-lg scale-105' : 'hover:border-primary/50'
                            )}
                        >
                            <Users className="mx-auto h-12 w-12 text-primary" />
                            <h3 className="mt-4 text-lg font-bold">Mode Duo</h3>
                            <p className="text-sm text-muted-foreground">Collaborez avec un coéquipier.</p>
                        </Card>
                    </div>

                    {mode === 'duo' && (
                        <div className="space-y-2 animate-in fade-in-0">
                            <Label htmlFor="partner-select">Sélectionnez un coéquipier</Label>
                            <Select
                                onValueChange={setSelectedPartnerId}
                                value={selectedPartnerId || ''}
                                disabled={isLoadingCommercials}
                            >
                                <SelectTrigger id="partner-select">
                                    <SelectValue placeholder="Sélectionner un commercial" />
                                </SelectTrigger>
                                <SelectContent>
                                    {commercials.map(commercial => (
                                        <SelectItem key={commercial.id} value={commercial.id}>
                                            {commercial.prenom} {commercial.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={handleStartDuo}
                                disabled={!selectedPartnerId}
                                className="w-full bg-green-600 text-white hover:bg-green-700 mt-4"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Envoyer l'invitation
                            </Button>
                        </div>
                    )}
                </CardContent>

                {mode === 'solo' && (
                    <CardFooter className="flex justify-end">
                        <Button 
                            onClick={handleStartSolo}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            Commencer la prospection <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Modal
                isOpen={isSendingInvitation}
                onClose={() => {}} // Prevent closing by clicking outside
                title="Envoi de l'invitation..."
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-semibold mb-4">Envoi de l'invitation en cours...</p>
                    <Button 
                        variant="outline"
                        onClick={handleCancelInvitation}
                        disabled={!abortControllerRef.current} // Disable if no request is active
                    >
                        Annuler
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ProspectingSetupPage;