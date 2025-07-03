// src/components/ui/Modal.tsx
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Le conteneur principal qui couvre toute la page
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in-0"
      onClick={onClose} // Ferme la modale si on clique sur le fond
    >
      {/* La boîte de dialogue elle-même */}
      <div
        className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique à l'intérieur
      >
        {/* Le contenu que l'on passera à la modale */}
        {children}
      </div>
    </div>
  );
};