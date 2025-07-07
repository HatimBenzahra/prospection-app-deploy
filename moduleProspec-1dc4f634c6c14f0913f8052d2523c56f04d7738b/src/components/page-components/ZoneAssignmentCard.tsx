import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { Button } from '@/components/ui-admin/button';
import { MapPin, Users, Loader2 } from 'lucide-react';
import { AssignmentType } from '@/types/enums';
import { Commercial, Manager, Zone } from '@/types/types';

interface ZoneAssignmentCardProps {
  zones: Zone[];
  commercials: Commercial[];
  managers: Manager[];
  onAssign: (zoneId: string, assigneeId: string, assigneeType: AssignmentType) => Promise<void>;
  onZoneSelect: (zoneId: string) => void;
}

export const ZoneAssignmentCard = ({ zones, commercials, managers, onAssign, onZoneSelect }: ZoneAssignmentCardProps) => {
  const [selectedZone, setSelectedZone] = useState('');
  const [assigneeType, setAssigneeType] = useState<AssignmentType>(AssignmentType.COMMERCIAL);
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assigneeOptions = assigneeType === AssignmentType.COMMERCIAL ? commercials : managers;
  const isFormValid = selectedZone && assigneeId && assigneeType;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    await onAssign(selectedZone, assigneeId, assigneeType);
    setIsSubmitting(false);
  };
  
  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    onZoneSelect(zoneId);
  }
  
  const handleTypeChange = (type: AssignmentType) => {
    setAssigneeType(type);
    setAssigneeId(''); // Reset assignee when type changes
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-600">
          <MapPin className="mr-3 h-6 w-6" /> Assignation de Zone
        </CardTitle>
        <CardDescription>Assignez une zone à un commercial ou manager.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de Zone */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Zone à assigner</label>
            <Select onValueChange={handleZoneChange} value={selectedZone}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une zone" /></SelectTrigger>
                <SelectContent>
                    {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        {/* Sélecteur de Type (Commercial/Manager) */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Assigner à un</label>
            <Select onValueChange={handleTypeChange} value={assigneeType}>
                <SelectTrigger><SelectValue placeholder="Type d'assigné" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={AssignmentType.COMMERCIAL}>Commercial</SelectItem>
                    <SelectItem value={AssignmentType.MANAGER}>Manager</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Sélecteur de Personne */}
        <div className="space-y-2">
            <label className="text-sm font-medium">{assigneeType === AssignmentType.COMMERCIAL ? 'Commercial' : 'Manager'}</label>
            <Select onValueChange={setAssigneeId} value={assigneeId} disabled={!assigneeType}>
                <SelectTrigger><SelectValue placeholder={`Sélectionner un ${assigneeType.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>
                    {assigneeOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
          Assigner la Zone
        </Button>
      </CardContent>
    </Card>
  );
};