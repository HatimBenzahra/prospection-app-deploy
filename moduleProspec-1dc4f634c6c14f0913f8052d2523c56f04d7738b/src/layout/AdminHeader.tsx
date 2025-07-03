// src/layout/AdminHeader.tsx
import { useState } from 'react'; // 'useEffect' a été retiré car non utilisé
import { Button } from '@/components/ui-admin/button';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui-admin/sheet';
import { Menu } from 'lucide-react';
import { AdminNavContent } from './AdminNavContent';
import { BrandLogo } from '@/components/ui-commercial/BrandLogo';
import { DateTimeDisplay } from './DateTimeDisplay';
import { UserNav } from './UserNav';

const AdminHeader = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-b-[hsl(var(--winvest-blue-moyen))] bg-[hsl(var(--winvest-blue-moyen))] px-4 text-white sm:px-6">
      {/* Section de gauche : Titre et menu hamburger pour mobile */}
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-white/30 bg-transparent text-white hover:bg-black/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0 bg-white">
              <SheetHeader className='p-4 border-b'><BrandLogo /></SheetHeader>
              <div className="py-4">
                <AdminNavContent isCollapsed={false} onLinkClick={() => setIsSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Espace Admin</h1>
      </div>
      
      {/* Section de droite : Date, Heure et Menu Utilisateur */}
      <div className="flex items-center gap-4">
        <DateTimeDisplay />
        <div className="border-l h-8"></div> {/* Votre séparateur est bien conservé */}
        <UserNav />
      </div>
    </header>
  );
};

export default AdminHeader;