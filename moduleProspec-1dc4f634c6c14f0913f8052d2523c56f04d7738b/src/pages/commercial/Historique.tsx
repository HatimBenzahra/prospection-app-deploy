

import { useEffect, useState, useMemo } from 'react';
import { statisticsService } from '@/services/statistics.service';
import { zoneService } from '@/services/zone.service';
import type { ZoneFromApi } from '@/services/zone.service';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, Calendar, CheckCircle, XCircle, DoorOpen, Percent, Handshake, Phone, MessageSquare } from 'lucide-react';
import { Combobox } from '@/components/ui-admin/Combobox';
import type { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Button } from '@/components/ui-admin/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HistoryEntry {
  id: string;
  adresse: string;
  ville: string;
  dateProspection: string;
  nbPortesVisitees: number;
  nbContratsSignes: number;
  nbRdvPris: number;
  nbRefus: number;
  nbAbsents: number;
  nbCurieux: number; // Added nbCurieux
  commentaire: string;
  tauxCouverture: number;
  immeuble: { zoneId: string | null };
}

const HistoriquePage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [zones, setZones] = useState<ZoneFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR' | null>('MONTH'); // Default to MONTH

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [historyData, zonesData] = await Promise.all([
            statisticsService.getCommercialHistory(user.id),
            zoneService.getZones(),
          ]);
          setHistory(historyData);
          setZones(zonesData);
          setError(null);
        } catch (err) {
          setError("Erreur lors de la récupération des données.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const now = new Date();
    if (selectedPeriod === 'WEEK') {
      setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) });
    } else if (selectedPeriod === 'MONTH') {
      setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (selectedPeriod === 'YEAR') {
      setDateRange({ from: startOfYear(now), to: endOfYear(now) });
    } else {
      setDateRange(undefined);
    }
  }, [selectedPeriod]);

  const zoneOptions = useMemo(() => {
    return zones.map(zone => ({ value: zone.id, label: zone.nom }));
  }, [zones]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemDate = new Date(item.dateProspection);
      const inDateRange = !dateRange || (dateRange.from && dateRange.to && itemDate >= dateRange.from && itemDate <= dateRange.to);
      const isZoneMatch = !selectedZone || (item.immeuble && item.immeuble.zoneId === selectedZone);
      return inDateRange && isZoneMatch;
    });
  }, [history, dateRange, selectedZone]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Chargement de l'historique...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Historique de Prospection</h1>
      <Card className="mb-3 w-full">
        <CardContent className="flex flex-col md:flex-row items-center md:justify-between gap-6 py-3">
          <div className="w-full md:w-[350px]">
            <Combobox
              options={zoneOptions}
              value={selectedZone}
              onChange={setSelectedZone}
              placeholder="Filtrer par zone..."
              emptyMessage="Aucune zone trouvée."
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
            <Button 
                variant='ghost' 
                onClick={() => setSelectedPeriod('WEEK')} 
                className={cn(
                    "px-3 py-1.5 text-sm md:px-5 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300", 
                    selectedPeriod === 'WEEK' 
                        ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
            >Cette semaine</Button>
            <Button 
                variant='ghost' 
                onClick={() => setSelectedPeriod('MONTH')} 
                className={cn(
                    "px-3 py-1.5 text-sm md:px-5 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300", 
                    selectedPeriod === 'MONTH' 
                        ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
            >Ce mois</Button>
            <Button 
                variant='ghost' 
                onClick={() => setSelectedPeriod('YEAR')} 
                className={cn(
                    "px-3 py-1.5 text-sm md:px-5 md:py-2 md:text-base rounded-lg font-medium transition-all duration-300", 
                    selectedPeriod === 'YEAR' 
                        ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
            >Cette année</Button>
          </div>
        </CardContent>
      </Card>

      {filteredHistory.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Aucun historique de prospection ne correspond à vos filtres.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {filteredHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
              className=""
            >
              <Card className="flex flex-col p-3">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building className="mr-2 h-5 w-5" />
                  {item.adresse}, {item.ville}
                </CardTitle>
                <CardDescription className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(item.dateProspection).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm flex-grow">
                <div className="flex items-center">
                  <DoorOpen className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Portes visitées: <strong>{item.nbPortesVisitees}</strong></span>
                </div>
                <div className="flex items-center">
                  <Percent className="mr-2 h-4 w-4 text-indigo-500" />
                  <span>Couverture: <strong>{item.tauxCouverture}%</strong></span>
                </div>
                <div className="flex items-center">
                  <Handshake className="mr-2 h-4 w-4 text-green-500" />
                  <span>Contrats signés: <strong>{item.nbContratsSignes}</strong></span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-yellow-500" />
                  <span>RDV pris: <strong>{item.nbRdvPris}</strong></span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Absents: <strong>{item.nbAbsents}</strong></span>
                </div>
                <div className="flex items-center">
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  <span>Refus: <strong>{item.nbRefus}</strong></span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-purple-500" />
                  <span>Curieux: <strong>{item.nbCurieux}</strong></span>
                </div>
                
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoriquePage;
