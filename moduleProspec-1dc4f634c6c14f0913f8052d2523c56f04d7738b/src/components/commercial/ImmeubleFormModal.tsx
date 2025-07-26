import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui-admin/dialog';
import { Button } from '@/components/ui-admin/button';
import { Input } from '@/components/ui-admin/input';
import { Label } from '@/components/ui-admin/label';
import AddressInput from '@/components/ui-admin/AddressInput';
import { Loader2, ArrowRight, ArrowLeft, Plus, Minus, XCircle, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ImmeubleFormModalProps } from '../../types/types';

const ImmeubleFormModal: React.FC<ImmeubleFormModalProps> = ({
    isOpen,
    onClose,
    editingImmeuble,
    formState,
    onFormChange,
    onSubmit,
    isSubmitting,
    formStep,
    onNextStep,
    onPrevStep,
    setFormState
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-lg bg-white rounded-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 text-center shrink-0">
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-800">
                        {editingImmeuble ? "Modifier l'immeuble" : "Ajouter un nouvel immeuble"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 text-sm sm:text-base">
                        {formStep === 1
                            ? "Commencez par l'adresse de l'immeuble."
                            : "Ajoutez les détails de l'immeuble."}
                    </DialogDescription>
                </DialogHeader>

                {/* Barre de progression */}
                <div className="px-4 sm:px-6 shrink-0">
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <motion.div
                            className="bg-blue-600 h-1.5 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: formStep === 1 ? "50%" : "100%" }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <AnimatePresence mode="wait">
                        {formStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="grid gap-3 sm:gap-4 p-4 sm:p-6"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="adresse" className="font-semibold text-base sm:text-lg">Adresse</Label>
                                    <AddressInput
                                        initialValue={formState.adresse}
                                        onSelect={(selection) => {
                                            setFormState((prev) => ({
                                                ...prev,
                                                adresse: selection.address,
                                                ville: selection.city,
                                                codePostal: selection.postalCode,
                                                latitude: selection.latitude,
                                                longitude: selection.longitude,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ville" className="font-semibold text-base sm:text-lg">Ville</Label>
                                        <Input 
                                            id="ville" 
                                            name="ville" 
                                            value={formState.ville} 
                                            onChange={onFormChange} 
                                            placeholder="Ex : Paris" 
                                            className="h-10 sm:h-12 text-base sm:text-lg rounded-xl touch-manipulation"
                                            required 
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="codePostal" className="font-semibold text-base sm:text-lg">Code Postal</Label>
                                        <Input 
                                            id="codePostal" 
                                            name="codePostal" 
                                            value={formState.codePostal} 
                                            onChange={onFormChange} 
                                            placeholder="Ex : 75001" 
                                            className="h-10 sm:h-12 text-base sm:text-lg rounded-xl touch-manipulation"
                                            required 
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {formStep === 2 && (
                            <form key="step2" onSubmit={onSubmit}>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid gap-3 sm:gap-4 p-4 sm:p-6"
                                >
                                    {!editingImmeuble && (
                                        <div className="space-y-4 sm:space-y-6">
                                            <div className="space-y-2 sm:space-y-3">
                                                <Label className="font-semibold text-base sm:text-lg">Nombre d'étages</Label>
                                                <div className="flex items-center justify-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-2xl">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all touch-manipulation"
                                                        onClick={() => setFormState(prev => ({ ...prev, nbEtages: Math.max(1, (prev.nbEtages || 1) - 1) }))}
                                                        disabled={!formState.nbEtages || formState.nbEtages <= 1}
                                                    >
                                                        <Minus className="h-4 w-4 sm:h-6 sm:w-6" />
                                                    </Button>
                                                    <div className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 sm:px-6 sm:py-3 min-w-[80px] sm:min-w-[100px] text-center">
                                                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{formState.nbEtages || 1}</span>
                                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">étage{(formState.nbEtages || 1) > 1 ? 's' : ''}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all touch-manipulation"
                                                        onClick={() => setFormState(prev => ({ ...prev, nbEtages: Math.min(50, (prev.nbEtages || 1) + 1) }))}
                                                        disabled={(formState.nbEtages || 0) >= 50}
                                                    >
                                                        <Plus className="h-4 w-4 sm:h-6 sm:w-6" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 sm:space-y-3">
                                                <Label className="font-semibold text-base sm:text-lg">Portes par étage</Label>
                                                <div className="flex items-center justify-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-2xl">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all touch-manipulation"
                                                        onClick={() => setFormState(prev => ({ ...prev, nbPortesParEtage: Math.max(1, (prev.nbPortesParEtage || 1) - 1) }))}
                                                        disabled={!formState.nbPortesParEtage || formState.nbPortesParEtage <= 1}
                                                    >
                                                        <Minus className="h-4 w-4 sm:h-6 sm:w-6" />
                                                    </Button>
                                                    <div className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 sm:px-6 sm:py-3 min-w-[80px] sm:min-w-[100px] text-center">
                                                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{formState.nbPortesParEtage || 1}</span>
                                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">porte{(formState.nbPortesParEtage || 1) > 1 ? 's' : ''}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all touch-manipulation"
                                                        onClick={() => setFormState(prev => ({ ...prev, nbPortesParEtage: Math.min(20, (prev.nbPortesParEtage || 1) + 1) }))}
                                                        disabled={(formState.nbPortesParEtage || 0) >= 20}
                                                    >
                                                        <Plus className="h-4 w-4 sm:h-6 sm:w-6" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            {formState.nbEtages && formState.nbPortesParEtage && (
                                                <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                    <div className="text-center">
                                                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Total des portes</p>
                                                        <p className="text-xl sm:text-2xl font-bold text-blue-800 mt-1">
                                                            {formState.nbEtages * formState.nbPortesParEtage} portes
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="digicode" className="font-semibold text-base sm:text-lg">Digicode</Label>
                                            <Input 
                                                id="digicode" 
                                                name="digicode" 
                                                value={formState.digicode} 
                                                onChange={onFormChange} 
                                                placeholder="Entrez le digicode (optionnel)" 
                                                className="h-10 sm:h-12 text-base sm:text-lg rounded-xl touch-manipulation"
                                            />
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
                                            <Label className="font-semibold text-base sm:text-lg">Ascenseur</Label>
                                            <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl">
                                                <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                                                    <Button
                                                        type="button"
                                                        variant={!formState.hasElevator ? "default" : "outline"}
                                                        className={cn(
                                                            "h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation transition-all flex-1 sm:flex-none",
                                                            !formState.hasElevator 
                                                                ? "bg-slate-600 text-white hover:bg-slate-700" 
                                                                : "border-2 border-slate-300 hover:border-slate-400"
                                                        )}
                                                        onClick={() => setFormState(prev => ({ ...prev, hasElevator: false }))}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                        Non
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={formState.hasElevator ? "default" : "outline"}
                                                        className={cn(
                                                            "h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation transition-all flex-1 sm:flex-none",
                                                            formState.hasElevator 
                                                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                                                : "border-2 border-slate-300 hover:border-slate-400"
                                                        )}
                                                        onClick={() => setFormState(prev => ({ ...prev, hasElevator: true }))}
                                                    >
                                                        <ArrowUpDown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                        Oui
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer fixe */}
                <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 flex justify-between w-full gap-3 bg-slate-50 border-t border-slate-200">
                    {formStep === 1 ? (
                        <>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose}
                                className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation flex-1 sm:flex-none"
                            >
                                Annuler
                            </Button>
                            <Button 
                                type="button" 
                                onClick={onNextStep} 
                                className="bg-blue-600 text-white hover:bg-blue-700 h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation flex-1 sm:flex-none"
                            >
                                Suivant
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onPrevStep} 
                                className="flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation flex-1 sm:flex-none"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Précédent
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="bg-blue-600 text-white hover:bg-blue-700 h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold touch-manipulation flex-1 sm:flex-none"
                                onClick={formStep === 2 ? onSubmit : undefined}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingImmeuble ? "Mettre à jour" : "Créer l'immeuble"}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImmeubleFormModal;