import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Avatar } from '@/components/ui-admin/avatar';
import { Badge } from '@/components/ui-admin/badge';
import { ScrollArea } from '@/components/ui-admin/scroll-area';
import { MapPin, Clock, Zap, Users } from 'lucide-react';
import type { CommercialGPS } from '@/types/types';

interface SuiviSidebarProps {
  commercials: CommercialGPS[];
  selectedCommercial: CommercialGPS | null;
  onSelectCommercial: (commercial: CommercialGPS) => void;
}

const formatLastUpdate = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  return date.toLocaleDateString('fr-FR');
};

export const SuiviSidebar = ({ commercials, selectedCommercial, onSelectCommercial }: SuiviSidebarProps) => {
  const onlineCommercials = commercials.filter(c => c.isOnline);
  const offlineCommercials = commercials.filter(c => !c.isOnline);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Statistiques */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Suivi GPS en temps réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>En ligne: {onlineCommercials.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Hors ligne: {offlineCommercials.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails du commercial sélectionné */}
      {selectedCommercial && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-medium">
                  {selectedCommercial.avatarFallback}
                </div>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedCommercial.name}</p>
                <p className="text-sm text-gray-600">{selectedCommercial.equipe}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>
                  {selectedCommercial.position[0].toFixed(4)}, {selectedCommercial.position[1].toFixed(4)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{formatLastUpdate(selectedCommercial.lastUpdate)}</span>
              </div>
              
              {selectedCommercial.speed !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <span>{selectedCommercial.speed.toFixed(1)} km/h</span>
                </div>
              )}
              
              <Badge variant={selectedCommercial.isOnline ? "default" : "secondary"}>
                {selectedCommercial.isOnline ? "En ligne" : "Hors ligne"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des commerciaux */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Commerciaux ({commercials.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {/* Commerciaux en ligne */}
              {onlineCommercials.length > 0 && (
                <>
                  <p className="text-sm font-medium text-green-600 mb-2">En ligne</p>
                  {onlineCommercials.map(commercial => (
                    <div
                      key={commercial.id}
                      onClick={() => onSelectCommercial(commercial)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCommercial?.id === commercial.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                              {commercial.avatarFallback}
                            </div>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{commercial.name}</p>
                          <p className="text-xs text-gray-600">{commercial.equipe}</p>
                          <p className="text-xs text-gray-500">{formatLastUpdate(commercial.lastUpdate)}</p>
                        </div>
                        {commercial.speed !== undefined && (
                          <div className="text-xs text-gray-600">
                            {commercial.speed.toFixed(0)} km/h
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Commerciaux hors ligne */}
              {offlineCommercials.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-500 mb-2 mt-4">Hors ligne</p>
                  {offlineCommercials.map(commercial => (
                    <div
                      key={commercial.id}
                      onClick={() => onSelectCommercial(commercial)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors opacity-60 ${
                        selectedCommercial?.id === commercial.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <div className="w-full h-full bg-gray-400 text-white flex items-center justify-center text-sm font-medium">
                            {commercial.avatarFallback}
                          </div>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{commercial.name}</p>
                          <p className="text-xs text-gray-600">{commercial.equipe}</p>
                          <p className="text-xs text-gray-500">{formatLastUpdate(commercial.lastUpdate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};