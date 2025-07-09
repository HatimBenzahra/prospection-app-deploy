import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { immeubleService, type ImmeubleFromApi } from '../../services/immeuble.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui-admin/skeleton';
import { Button } from '../../components/ui-admin/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui-admin/dialog';
import { Input } from '../../components/ui-admin/input';
import { Checkbox } from '../../components/ui-admin/checkbox';
import { Label } from '../../components/ui-admin/label';
import { Loader2, PlusCircle, Building, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui-admin/card';

type ImmeubleFormState = {
  adresse: string;
  ville: string;
  codePostal: string;
  nbPortesTotal: number;
  hasElevator: boolean;
  digicode?: string;
  latitude?: number;
  longitude?: number;
};

const PageSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
);

const CommercialImmeublesPage: React.FC = () => {
  const { user } = useAuth();
  const [immeubles, setImmeubles] = useState<ImmeubleFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingImmeuble, setEditingImmeuble] = useState<ImmeubleFromApi | null>(null);
  const [formState, setFormState] = useState<ImmeubleFormState>({} as ImmeubleFormState);

  const geocodeAddress = useCallback(async (address: string, city: string, postalCode: string) => {
    // In a real application, this function would call a geocoding API (e.g., OpenStreetMap Nominatim, Google Maps Geocoding API)
    // to convert the address into latitude and longitude coordinates. An API key would likely be required.
    // For this simulation, we're generating dummy coordinates.
    if (!address || !city || !postalCode) return { latitude: undefined, longitude: undefined };
    await new Promise(resolve => setTimeout(resolve, 500));
    const seed = (address + city + postalCode).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      latitude: 45.7640 + (seed % 1000) / 10000,
      longitude: 4.8356 + (seed % 1000) / 10000,
    };
  }, []);

  const fetchImmeubles = useCallback(async () => {
    if (!user?.id) {
      setError('Commercial non identifié.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await immeubleService.getImmeublesForCommercial(user.id);
      setImmeubles(data);
    } catch (err) {
      setError('Impossible de charger les immeubles.');
      toast.error('Impossible de charger les immeubles.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchImmeubles();
  }, [fetchImmeubles]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  // Geocode when address fields change
  useEffect(() => {
    const { adresse, ville, codePostal } = formState;
    if (adresse && ville && codePostal) {
      geocodeAddress(adresse, ville, codePostal).then(({ latitude, longitude }) => {
        setFormState(prev => ({ ...prev, latitude, longitude }));
      });
    }
  }, [formState.adresse, formState.ville, formState.codePostal, geocodeAddress]);

  const handleOpenModal = (immeuble: ImmeubleFromApi | null = null) => {
    setEditingImmeuble(immeuble);
    if (immeuble) {
      setFormState({
        adresse: immeuble.adresse, ville: immeuble.ville, codePostal: immeuble.codePostal,
        nbPortesTotal: immeuble.nbPortesTotal, hasElevator: immeuble.hasElevator,
        digicode: immeuble.digicode || '', latitude: immeuble.latitude || undefined, longitude: immeuble.longitude || undefined,
      });
    } else {
      setFormState({
        adresse: '', ville: '', codePostal: '', nbPortesTotal: 10, hasElevator: false,
        digicode: '', latitude: undefined, longitude: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);
    const dataToSubmit = { 
      ...formState, 
      nbPortesTotal: Number(formState.nbPortesTotal),
      latitude: Number(formState.latitude),
      longitude: Number(formState.longitude),
    };
    try {
      if (editingImmeuble) {
        await immeubleService.updateImmeubleForCommercial(editingImmeuble.id, dataToSubmit, user.id);
        toast.success('Immeuble mis à jour avec succès.');
      } else {
        await immeubleService.createImmeubleForCommercial(dataToSubmit, user.id);
        toast.success('Immeuble créé avec succès.');
      }
      setIsModalOpen(false);
      fetchImmeubles();
    } catch (error: any) {
      if (error.response && error.response.status === 404 && error.response.data.message.includes('No zone found')) {
        toast.error('Vous devez avoir une zone assignée pour créer un immeuble. Veuillez contacter votre administrateur.');
      } else {
        toast.error('Une erreur est survenue lors de la sauvegarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) {
      toast.error('Commercial non identifié. Impossible de supprimer l\'immeuble.');
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet immeuble ?')) {
      try {
        console.log('Attempting to delete immeuble with ID:', id, 'for commercial ID:', user.id);
        await immeubleService.deleteImmeubleForCommercial(id, user.id);
        toast.success('Immeuble supprimé.');
        fetchImmeubles();
      } catch (error) {
        console.error('Erreur deleting immeuble:', error);
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="py-10 p-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes Immeubles</CardTitle>
          <Button onClick={() => handleOpenModal()} className="bg-black text-white hover:bg-gray-800"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un immeuble</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {immeubles.map((immeuble) => (
              <Card key={immeuble.id} className="flex flex-col h-full border-border bg-card text-card-foreground shadow-sm min-w-0 flex-shrink-0">
                <CardHeader className="flex-row items-center justify-between pb-2 min-w-0">
                  <CardTitle className="text-lg break-words">{immeuble.adresse}</CardTitle>
                  <Building className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <CardDescription className="text-sm break-words w-full">
                    {immeuble.ville}, {immeuble.codePostal}
                  </CardDescription>
                  <div className="mt-2 text-sm break-words w-full">
                    <p className="min-w-0"><strong>Statut:</strong> <span className="font-medium text-foreground break-words">{immeuble.status}</span></p>
                    <p className="min-w-0"><strong>Zone:</strong> <span className="font-medium text-foreground break-words">{immeuble.zone?.nom ?? 'N/A'}</span></p>
                    <p className="min-w-0"><strong>Portes:</strong> <span className="font-medium text-foreground break-words">{immeuble.nbPortesTotal}</span></p>
                    <p className="min-w-0"><strong>Ascenseur:</strong> <span className="font-medium text-foreground break-words">{immeuble.hasElevator ? 'Oui' : 'Non'}</span></p>
                    {immeuble.digicode && <p className="min-w-0"><strong>Digicode:</strong> <span className="font-medium text-foreground break-words">{immeuble.digicode}</span></p>}
                  </div>
                </CardContent>
                <div className="flex flex-col sm:flex-row justify-end items-end p-4 pt-0 gap-2">
                  <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto" size="sm" onClick={() => handleOpenModal(immeuble)}><Edit className="h-4 w-4 mr-2" />Modifier</Button>
                  <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto" size="sm" onClick={() => handleDelete(immeuble.id)}><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>
                </div>
              </Card>
            ))}
          </div>
          {immeubles.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun immeuble trouvé pour ce commercial.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{editingImmeuble ? 'Modifier' : 'Ajouter'} un immeuble</DialogTitle>
            <DialogDescription>Renseignez les informations de l'immeuble. La latitude et longitude sont calculées automatiquement.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <Input name="adresse" value={formState.adresse} onChange={handleFormChange} placeholder="Adresse" required />
            <div className="grid grid-cols-2 gap-4">
                <Input name="ville" value={formState.ville} onChange={handleFormChange} placeholder="Ville" required />
                <Input name="codePostal" value={formState.codePostal} onChange={handleFormChange} placeholder="Code Postal" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="digicode" value={formState.digicode} onChange={handleFormChange} placeholder="Digicode (optionnel)" />
              <Input name="nbPortesTotal" type="number" value={formState.nbPortesTotal} onChange={handleFormChange} placeholder="Nb. Portes" required />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="hasElevator" name="hasElevator" checked={formState.hasElevator} onCheckedChange={(checked) => setFormState(prev => ({ ...prev, hasElevator: !!checked }))} />
              <Label htmlFor="hasElevator">Ascenseur présent</Label>
            </div>
            <DialogFooter>
                <Button type="button" className="bg-black text-white hover:bg-gray-800" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-gray-800">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingImmeuble ? 'Mettre à jour' : 'Créer'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercialImmeublesPage;