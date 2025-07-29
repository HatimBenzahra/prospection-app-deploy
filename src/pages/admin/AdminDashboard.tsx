import { useState, useEffect, useRef } from 'react';
import WebRTCManager from '@/services/audio-stream.service';

const AdminDashboard = () => {
    const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [commercialId, setCommercialId] = useState(''); // This would be dynamically set in a real app
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (commercialId) {
            const manager = new WebRTCManager(commercialId, true);
            setWebRTCManager(manager);

            manager.onRemoteStream((stream) => {
                if (audioRef.current) {
                    audioRef.current.srcObject = stream;
                }
            });

            return () => {
                manager.stop();
            };
        }
    }, [commercialId]);

    const startListening = async () => {
        if (webRTCManager) {
            await webRTCManager.listenToCommercial();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (webRTCManager) {
            webRTCManager.stop();
            setIsListening(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
                <input 
                    type="text" 
                    value={commercialId} 
                    onChange={(e) => setCommercialId(e.target.value)} 
                    placeholder="Enter Commercial ID"
                    className="border p-2 rounded-md"
                />
                <button 
                    onClick={isListening ? stopListening : startListening}
                    className={`px-4 py-2 rounded-md text-white ${isListening ? 'bg-red-500' : 'bg-blue-500'}`}
                >
                    {isListening ? 'Stop Listening' : 'Listen to Commercial'}
                </button>
            </div>
            <audio ref={audioRef} autoPlay controls className="mt-4" />
        </div>
    );
};

export default AdminDashboard;
