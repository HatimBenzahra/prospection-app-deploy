// src/pages/commercial/ProspectingSetupPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui-admin/card';
import { Button } from '@/components/ui-admin/button';
import { Input } from '@/components/ui-admin/input';
import { Label } from '@/components/ui-admin/label';
import { User, Users, ArrowRight, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProspectingMode = 'solo' | 'duo';

const ProspectingSetupPage = () => {
    const { buildingId } = useParams<{ buildingId: string }>();
    const navigate = useNavigate();
    const [mode, setMode] = useState<ProspectingMode | null>(null);
    const [duoEmail, setDuoEmail] = useState('');

    console.log(`ProspectingSetupPage loaded with buildingId: ${buildingId}`);

    const handleStartSolo = () => {
        console.log(`Navigating from ProspectingSetupPage with ID: ${buildingId}`);
        console.log(`Démarrage en SOLO pour l'immeuble ${buildingId}`);
        navigate(`/commercial/prospecting/doors/${buildingId}`);
    };

    const handleInviteDuo = () => {
        if (duoEmail) {
            console.log(`Invitation envoyée à ${duoEmail} pour l'immeuble ${buildingId}`);
            alert(`Invitation envoyée à ${duoEmail} !`);
        }
    };

    return (
        <div className="container mx-auto py-8">
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
                            <Label htmlFor="duo-email">Email du coéquipier</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="duo-email" 
                                    type="email"
                                    placeholder="nom.prenom@winvest.capital"
                                    value={duoEmail}
                                    onChange={(e) => setDuoEmail(e.target.value)}
                                />
                                <Button 
                                    onClick={handleInviteDuo}
                                    disabled={!duoEmail}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Inviter
                                </Button>
                            </div>
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
        </div>
    );
};

export default ProspectingSetupPage;