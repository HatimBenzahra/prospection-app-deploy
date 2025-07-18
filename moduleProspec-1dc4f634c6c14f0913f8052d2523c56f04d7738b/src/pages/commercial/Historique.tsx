

import { useEffect, useState, useMemo } from 'react';
import { statisticsService } from '@/services/statistics.service';
import { zoneService } from '@/services/zone.service';
import type { ZoneFromApi } from '@/services/zone.service';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, Calendar, CheckCircle, XCircle, DoorOpen, Percent, Handshake, Phone, MessageSquare, Search, ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react';
import { Combobox } from '@/components/ui-admin/Combobox';
import type { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui-admin/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui-admin/skeleton';

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
  nbCurieux: number;
  commentaire: string;
  tauxCouverture: number;
  immeuble: { zoneId: string | null };
}

const PageSkeleton = () => (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 animate-pulse max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/2" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
        </div>
    </div>
);

const StatItem = ({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: string | number, colorClass: string }) => (
    <div className="flex items-start p-3 bg-gray-100 rounded-lg">
        <Icon className={cn("h-6 w-6 mr-3 flex-shrink-0", colorClass)} />
        <div>
            <p className="text-sm font-semibold text-gray-600">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const HistoriquePage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [zones, setZones] = useState<ZoneFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR' | null>('MONTH');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-500 text-center p-4 bg-red-50 h-screen">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen hide-scrollbar">
        <motion.div 
            className="space-y-8 max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 pb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center md:justify-start gap-4">
                    <HistoryIcon className="h-12 w-12 text-blue-600"/>
                    Historique de Prospection
                </h1>
                <p className="mt-4 text-xl text-gray-700 max-w-3xl mx-auto md:mx-0">Retrouvez le détail de toutes vos activités de prospection passées.</p>
            </div>

            <Card className="rounded-2xl shadow-lg border-none">
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
                    <div className="w-full md:w-72">
                        <Combobox
                            options={zoneOptions}
                            value={selectedZone}
                            onChange={setSelectedZone}
                            placeholder="Filtrer par zone..."
                            emptyMessage="Aucune zone trouvée."
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl shadow-inner">
                        {(['WEEK', 'MONTH', 'YEAR'] as const).map(period => (
                            <Button 
                                key={period}
                                variant='ghost' 
                                onClick={() => setSelectedPeriod(period)} 
                                className={cn(
                                    "px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-300",
                                    selectedPeriod === period 
                                        ? 'bg-white text-blue-600 shadow-md' 
                                        : 'text-gray-600 hover:bg-white/60'
                                )}
                            >{
                                {WEEK: 'Semaine', MONTH: 'Mois', YEAR: 'Année'}[period]
                            }</Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {paginatedHistory.length === 0 ? (
                <div className="text-center py-20 col-span-full bg-white rounded-2xl shadow-lg">
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-xl font-semibold text-gray-800">Aucun historique trouvé</p>
                    <p className="text-gray-500 mt-2">Aucune prospection ne correspond à vos filtres pour cette période.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginatedHistory.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="w-full h-full"
                            >
                                <Card className="flex flex-col h-full rounded-2xl bg-white text-card-foreground shadow-lg hover:shadow-2xl transition-all duration-300 border-none transform hover:-translate-y-1">
                                    <CardHeader className="pt-4 pb-3 px-6 bg-blue-50 rounded-t-2xl border-b border-blue-100">
                                        <CardTitle className="flex items-center gap-3 text-2xl font-extrabold text-gray-900 overflow-hidden">
                                            <Building className="h-7 w-7 text-primary flex-shrink-0" />
                                            <span className="truncate min-w-0">{item.adresse}, {item.ville}</span>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-sm font-medium text-gray-600 mt-2">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(item.dateProspection), 'd MMMM yyyy', { locale: fr })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 flex-grow mt-4">
                                        <StatItem icon={DoorOpen} label="Portes visitées" value={item.nbPortesVisitees} colorClass="text-blue-500" />
                                        <StatItem icon={Percent} label="Couverture" value={`${Number(item.tauxCouverture).toFixed(2)}%`} colorClass="text-indigo-500" />
                                        <StatItem icon={Handshake} label="Contrats" value={item.nbContratsSignes} colorClass="text-green-500" />
                                        <StatItem icon={Phone} label="RDV" value={item.nbRdvPris} colorClass="text-yellow-500" />
                                        <StatItem icon={XCircle} label="Refus" value={item.nbRefus} colorClass="text-red-500" />
                                        <StatItem icon={CheckCircle} label="Absents" value={item.nbAbsents} colorClass="text-gray-500" />
                                        <StatItem icon={MessageSquare} label="Curieux" value={item.nbCurieux} colorClass="text-purple-500" />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-8">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-10 w-10 rounded-full bg-white shadow-md"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="text-sm font-semibold text-gray-700">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-10 w-10 rounded-full bg-white shadow-md"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    </div>
  );
};

export default HistoriquePage;
