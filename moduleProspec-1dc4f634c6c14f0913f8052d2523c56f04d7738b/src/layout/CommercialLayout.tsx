// src/layout/CommercialLayout.tsx
import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { CommercialSidebar } from './CommercialSidebar';
import CommercialHeader from './CommercialHeader';
import { useAuth } from '@/contexts/AuthContext';
import { prospectionService } from '@/services/prospection.service';
import { Modal } from '@/components/ui-admin/Modal';
import { Button } from '@/components/ui-admin/button';
import { toast } from 'sonner';

const CommercialLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const [pendingRequest, setPendingRequest] = useState<any | null>(null); // Type this properly

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const fetchPendingRequests = useCallback(async () => {
    if (user?.id) {
      try {
        const requests = await prospectionService.getPendingRequestsForCommercial(user.id);
        if (requests.length > 0) {
          setPendingRequest(requests[0]); // Display the first pending request
        } else {
          setPendingRequest(null);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        toast.error("Erreur lors du chargement des demandes de prospection.");
      }
    }
  }, [user]);

  useEffect(() => {
    fetchPendingRequests(); // Fetch immediately on mount
    const interval = setInterval(fetchPendingRequests, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchPendingRequests]);

  const handleRequestResponse = async (accept: boolean) => {
    if (!pendingRequest) return;
    try {
      await prospectionService.handleProspectionRequest({
        requestId: pendingRequest.id,
        accept,
      });
      toast.success(accept ? "Demande acceptée !" : "Demande refusée.");
      setPendingRequest(null); // Close modal
      // Optionally, navigate or refresh data if needed after accepting
    } catch (error) {
      console.error("Error handling request:", error);
      toast.error("Erreur lors du traitement de la demande.");
    }
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <CommercialSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <CommercialHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {pendingRequest && (
        <Modal
          isOpen={!!pendingRequest}
          onClose={() => setPendingRequest(null)} // Allow closing, but it's blocking
          title="Nouvelle demande de prospection en duo"
          maxWidth="max-w-md"
        >
          <p className="mb-4">
            {pendingRequest.requester.prenom} {pendingRequest.requester.nom} vous invite à une prospection en duo pour l'immeuble situé au:
          </p>
          <p className="font-semibold mb-4">
            {pendingRequest.immeuble.adresse}, {pendingRequest.immeuble.codePostal} {pendingRequest.immeuble.ville}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleRequestResponse(false)}>Refuser</Button>
            <Button onClick={() => handleRequestResponse(true)} className="bg-green-600 text-black hover:bg-green-700">Accepter</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CommercialLayout;