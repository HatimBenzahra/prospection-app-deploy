// src/layout/CommercialLayout.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { prospectionService } from '@/services/prospection.service';
import { Modal } from '@/components/ui-admin/Modal';
import { Button } from '@/components/ui-admin/button';
import { toast } from 'sonner';
import { CommercialBottomBar } from './CommercialBottomBar';
import CommercialHeader from './CommercialHeader';

const CommercialLayout = () => {
  const { user } = useAuth();
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  const fetchPendingRequests = useCallback(async () => {
    if (user?.id) {
      try {
        const requests = await prospectionService.getPendingRequestsForCommercial(user.id);
        if (requests.length > 0) {
          setPendingRequest(requests[0]);
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
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingRequests]);

  const handleRequestResponse = async (accept: boolean) => {
    if (!pendingRequest) return;
    try {
      const response = await prospectionService.handleProspectionRequest({
        requestId: pendingRequest.id,
        accept,
      });
      toast.success(accept ? "Demande acceptée !" : "Demande refusée.");
      setPendingRequest(null);
      await fetchPendingRequests();
      if (accept && response.immeubleId) {
        navigate(`/commercial/prospecting/doors/${response.immeubleId}`);
      }
    } catch (error) {
      toast.error("Erreur lors du traitement de la demande.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <CommercialHeader />
      <main ref={mainContentRef} className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <CommercialBottomBar />

      {pendingRequest && (
        <Modal
          isOpen={!!pendingRequest}
          onClose={() => setPendingRequest(null)}
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