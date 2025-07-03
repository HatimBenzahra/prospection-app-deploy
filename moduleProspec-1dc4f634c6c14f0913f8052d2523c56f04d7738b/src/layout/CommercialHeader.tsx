// src/layout/CommercialHeader.tsx
import { useState } from 'react';
import { Button } from '@/components/ui-admin/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui-admin/sheet';
import { Menu } from 'lucide-react';
import { CommercialNavContent } from './CommercialNavContent';
import { BrandLogo } from '@/components/ui-commercial/BrandLogo';
import { DateTimeDisplay } from './DateTimeDisplay';
import { UserNav } from './UserNav';

const CommercialHeader = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-b-[hsl(var(--winvest-blue-moyen))] bg-[hsl(var(--winvest-blue-moyen))] px-4 text-white sm:px-6">
      
      {/* Section de gauche */}
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-black/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0 bg-white">
              <div className="p-4 border-b"><BrandLogo /></div>
              <div className="py-4 px-2">
                <CommercialNavContent isCollapsed={false} onLinkClick={() => setIsSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Espace Commercial</h1>
      </div>
      
      {/* Section de droite */}
      <div className="flex items-center gap-4">
        <DateTimeDisplay />
        <UserNav />
      </div>
    </header>
  );
};

export default CommercialHeader;