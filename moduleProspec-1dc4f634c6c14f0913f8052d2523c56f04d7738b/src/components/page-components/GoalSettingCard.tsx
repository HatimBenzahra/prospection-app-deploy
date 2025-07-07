import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-admin/select';
import { Button } from '@/components/ui-admin/button';
import { Input } from '@/components/ui-admin/input';
import { Target, Users, Loader2 } from 'lucide-react';
import { Commercial } from '@/types/types';

interface GoalSettingCardProps {
  commercials: Commercial[];
  onSetGoal: (commercialId: string, goal: number) => Promise<void>;
}

export const GoalSettingCard = ({ commercials, onSetGoal }: GoalSettingCardProps) => {
  const [commercialId, setCommercialId] = useState('');
  const [goal, setGoal] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = commercialId && typeof goal === 'number' && goal > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    await onSetGoal(commercialId, goal as number);
    setIsSubmitting(false);
  };
  
  return (
     <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-green-600">
          <Target className="mr-3 h-6 w-6" /> Définir un Objectif
        </CardTitle>
        <CardDescription>Fixez l'objectif mensuel de contrats pour un commercial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de Commercial */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Commercial</label>
          <Select onValueChange={setCommercialId} value={commercialId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un commercial" /></SelectTrigger>
            <SelectContent>
              {commercials.map(c => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {/* Input de l'objectif */}
        <div className="space-y-2">
            <label htmlFor="monthly-goal" className="text-sm font-medium">Objectif (nombre de contrats)</label>
            <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    id="monthly-goal" 
                    type="number" 
                    value={goal}
                    onChange={e => setGoal(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                    min="1"
                    placeholder="Ex: 10" 
                    className="pl-10" 
                />
            </div>
        </div>

        <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
          Définir l'Objectif
        </Button>
      </CardContent>
    </Card>
  );
}