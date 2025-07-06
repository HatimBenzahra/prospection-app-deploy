import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { Button } from '@/components/ui-admin/button';
import { Input } from '@/components/ui-admin/input';
import { Label } from '@/components/ui-admin/label';
import { Users, MapPin, Target } from 'lucide-react';
import { commercialService } from '@/services/commercial.service';
import { zoneService } from '@/services/zone.service';
import { managerService } from '@/services/manager.service';
import { assignmentGoalsService } from '@/services/assignment-goals.service';
import MapComponent from '@/components/MapComponent';
import { AssignmentType } from '@/types/assignment-type';

interface Commercial {
  id: string;
  nom: string;
  prenom: string;
}

interface Manager {
  id: string;
  nom: string;
  prenom: string;
}

interface Zone {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  rayonMetres: number;
}

const AssignmentGoalsPage = () => {
  const [commercials, setCommercials] = useState<Commercial[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedZoneDetails, setSelectedZoneDetails] = useState<Zone | null>(null);
  const [selectedAssigneeType, setSelectedAssigneeType] = useState<AssignmentType>(AssignmentType.COMMERCIAL);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [monthlyGoalCommercialId, setMonthlyGoalCommercialId] = useState<string>('');
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const [commercialsData, zonesData, managersData] = await Promise.all([
        commercialService.getCommerciaux(),
        zoneService.getZones(),
        managerService.getManagers(),
      ]);
      setCommercials(commercialsData);
      setZones(zonesData);
      setManagers(managersData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      const zone = zones.find(z => z.id === selectedZone);
      setSelectedZoneDetails(zone || null);
    }
  }, [selectedZone, zones]);

  const handleAssignZone = async () => {
    if (selectedZone && selectedAssigneeId && selectedAssigneeType) {
      try {
        await assignmentGoalsService.assignZone(selectedZone, selectedAssigneeId, selectedAssigneeType);
        alert('Zone assignée avec succès!');
      } catch (error) {
        console.error("Erreur lors de l'assignation de la zone:", error);
        alert("Erreur lors de l'assignation de la zone.");
      }
    } else {
      alert('Veuillez sélectionner une zone, un type d\'assignation et un assigné.');
    }
  };

  const handleSetGoal = async () => {
    if (monthlyGoalCommercialId && monthlyGoal > 0) {
      try {
        await assignmentGoalsService.setMonthlyGoal(monthlyGoalCommercialId, monthlyGoal, new Date().getMonth() + 1, new Date().getFullYear());
        alert('Objectif mensuel défini avec succès!');
      } catch (error) {
        console.error("Erreur lors de la définition de l'objectif:", error);
        alert("Erreur lors de la définition de l'objectif.");
      }
    } else {
      alert('Veuillez sélectionner un commercial et définir un objectif valide.');
    }
  };

  const assigneeOptions = selectedAssigneeType === AssignmentType.COMMERCIAL
    ? commercials.map(c => ({ id: c.id, nom: `${c.prenom} ${c.nom}` }))
    : managers.map(m => ({ id: m.id, nom: `${m.prenom} ${m.nom}` }));

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-2 pb-4 border-gray-200">Assignations et Objectifs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow">
        <div className="space-y-10">
          <Card className="shadow-lg border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <MapPin className="mr-2 h-6 w-6" /> Assignation de Zone
              </CardTitle>
              <CardDescription>Assignez des zones géographiques aux commerciaux ou aux managers pour la prospection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <Select onValueChange={setSelectedZone} value={selectedZone}>
                    <SelectTrigger id="zone-select" className="w-full"><SelectValue placeholder="Sélectionner une zone" /></SelectTrigger>
                    <SelectContent>
                      {zones.map(z => (
                        <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee-type-select">Type d'assignation</Label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <Select onValueChange={(value: AssignmentType) => {
                      setSelectedAssigneeType(value);
                      setSelectedAssigneeId('');
                    }} value={selectedAssigneeType}>
                      <SelectTrigger id="assignee-type-select" className="w-full"><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AssignmentType.COMMERCIAL}>Commercial</SelectItem>
                        <SelectItem value={AssignmentType.MANAGER}>Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee-select">Assigner à</Label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <Select onValueChange={setSelectedAssigneeId} value={selectedAssigneeId}>
                      <SelectTrigger id="assignee-select" className="w-full"><SelectValue placeholder="Sélectionner un assigné" /></SelectTrigger>
                      <SelectContent>
                        {assigneeOptions.map(assignee => (
                          <SelectItem key={assignee.id} value={assignee.id}>{assignee.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAssignZone} className="bg-blue-600 text-white hover:bg-blue-700">Assigner la Zone</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Target className="mr-2 h-6 w-6" /> Définir un Objectif Mensuel
              </CardTitle>
              <CardDescription>Définissez des objectifs de contrats mensuels pour les commerciaux.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <Select onValueChange={setMonthlyGoalCommercialId} value={monthlyGoalCommercialId}>
                    <SelectTrigger id="commercial-select-goal" className="w-full"><SelectValue placeholder="Sélectionner un commercial" /></SelectTrigger>
                    <SelectContent>
                      {commercials.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="monthly-goal">Objectif (Contrats)</Label>
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-gray-500" />
                    <Input id="monthly-goal" type="number" value={monthlyGoal} onChange={e => setMonthlyGoal(parseInt(e.target.value))} min="0" className="w-full" />
                  </div>
                </div>
                <Button onClick={handleSetGoal} className="bg-green-600 text-white hover:bg-green-700">Définir l'Objectif</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col space-y-10">
          <Card className="shadow-lg border-l-4 border-purple-500 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-700">
                <MapPin className="mr-2 h-6 w-6" /> Vue de la Zone
              </CardTitle>
              <CardDescription>Visualisez la zone sélectionnée sur la carte.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex items-center justify-center">
              {selectedZoneDetails ? (
                <MapComponent
                  latitude={selectedZoneDetails.latitude}
                  longitude={selectedZoneDetails.longitude}
                  zoom={14} 
                  radius={selectedZoneDetails.rayonMetres}
                />
              ) : (
                <p className="text-gray-500">Sélectionnez une zone pour la visualiser sur la carte.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentGoalsPage;