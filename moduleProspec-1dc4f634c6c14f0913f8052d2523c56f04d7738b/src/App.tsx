// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Logique de Routage ---
import PrivateRoute from './routes/PrivateRoute';
import RoleBasedRedirect from './routes/RoleBasedRedirect';

// --- Layouts et Pages Publiques ---
import AdminLayout from './layout/AdminLayout';
import CommercialLayout from './layout/CommercialLayout';
import Login from './pages/auth/Login';

// --- Pages Admin ---
import DashboardAdmin from './pages/admin/Dashboard/DashboardAdmin';
import ManagersPage from './pages/admin/Managers/ManagersPage';
import ManagerDetailsPage from './pages/admin/Managers/ManagerDetailsPage';
import CommerciauxPage from './pages/admin/commerciaux/CommerciauxPage';
import CommercialDetailsPage from './pages/admin/commerciaux/CommercialDetailsPage';
import EquipesPage from './pages/admin/Equipes/EquipesPage'; 
import EquipeDetailsPage from './pages/admin/Equipes/EquipeDetailsPage';
import StatistiquesPage from './pages/admin/statitistiques/StatistiquesPage';
import ZonesPage from './pages/admin/zones/ZonesPage';
import ZoneDetailsPage from './pages/admin/zones/ZoneDetailsPage'; 
import ImmeublesPage from './pages/admin/immeubles/ImmeublesPage';
import ImmeubleDetailsPage from './pages/admin/immeubles/portes/ImmeubleDetailsPage';
import SuiviPage from './pages/admin/suivi/SuiviPage';
import AssignmentGoalsPage from './pages/admin/assignment-goals/AssignmentGoalsPage';

// --- Pages Commercial ---
import CommercialDashboardPage from './pages/commercial/DashboardCommercial';
import SelectBuildingPage from './pages/commercial/SelectBuildingPage';
import ProspectingSetupPage from './pages/commercial/ProspectingSetupPage'; // <-- On importe le vrai composant
import ProspectingDoorsPage from './pages/commercial/ProspectingDoorsPage';

// On crée des composants temporaires pour les routes non encore développées
const CommercialHistory = () => <div className="p-8"><h1 className="text-3xl font-bold">Historique de Prospection</h1></div>;
const CommercialStats = () => <div className="p-8"><h1 className="text-3xl font-bold">Mes Statistiques</h1></div>;
const CommercialProfile = () => <div className="p-8"><h1 className="text-3xl font-bold">Mon Profil</h1></div>;

// --- Pages des autres Rôles (pour l'exemple) ---
import DashboardManager from './pages/manager/DashboardManager';
import DashboardDirecteur from './pages/directeur/DashboardDirecteur';
import DashboardBackoffice from './pages/backoffice/DashboardBackoffice';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Route Publique --- */}
        <Route path="/login" element={<Login />} />

        {/* --- Routes Privées Protégées --- */}
        <Route element={<PrivateRoute />}>
          
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* --- Layout pour les administrateurs --- */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardAdmin />} />
            <Route path="managers" element={<ManagersPage />} />
            <Route path="managers/:managerId" element={<ManagerDetailsPage />} />
            <Route path="equipes" element={<EquipesPage />} /> 
            <Route path="equipes/:equipeId" element={<EquipeDetailsPage />} />
            <Route path="commerciaux" element={<CommerciauxPage />} />
            <Route path="commerciaux/:id" element={<CommercialDetailsPage />} />
            <Route path="statistiques" element={<StatistiquesPage />} />
            <Route path="zones" element={<ZonesPage />} /> 
            <Route path="zones/:zoneId" element={<ZoneDetailsPage />} /> 
            <Route path="immeubles" element={<ImmeublesPage />} />
            <Route path="immeubles/:immeubleId" element={<ImmeubleDetailsPage />} />
            <Route path="suivi" element={<SuiviPage />} />
            <Route path="assignations-objectifs" element={<AssignmentGoalsPage />} />
          </Route>

          {/* --- Layout pour les commerciaux --- */}
          <Route path="/commercial" element={<CommercialLayout />}>
            <Route index element={<Navigate to="/commercial/dashboard" replace />} /> 
            
            <Route path="dashboard" element={<CommercialDashboardPage />} /> 
            
            {/* Flow de prospection */}
            <Route path="prospecting" element={<SelectBuildingPage />} />
            <Route path="prospecting/setup/:buildingId" element={<ProspectingSetupPage />} />
            <Route path="prospecting/doors/:buildingId" element={<ProspectingDoorsPage />} />

            {/* Autres pages du commercial */}
            <Route path="history" element={<CommercialHistory />} />
            <Route path="stats" element={<CommercialStats />} />
            <Route path="profile" element={<CommercialProfile />} />
          </Route>
            
          {/* Routes pour les autres rôles */}
          <Route path="/manager" element={<DashboardManager />} />
          <Route path="/directeur" element={<DashboardDirecteur />} />
          <Route path="/backoffice" element={<DashboardBackoffice />} />

        </Route>

        <Route path="*" element={<div>Page non trouvée</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;