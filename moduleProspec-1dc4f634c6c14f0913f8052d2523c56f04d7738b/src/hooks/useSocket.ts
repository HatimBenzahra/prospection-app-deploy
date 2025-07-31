import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (buildingId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!buildingId) return;

    // Configuration pour production Render
    const isProduction = window.location.hostname.includes('onrender.com');
    const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || 
      (isProduction ? 'prospection-backend.onrender.com' : window.location.hostname);
    const API_PORT = import.meta.env.VITE_API_PORT || (isProduction ? '' : '3000');
    const protocol = 'https'; // Toujours HTTPS en production
    
    const socketUrl = isProduction 
      ? `${protocol}://${SERVER_HOST}` 
      : `${protocol}://${SERVER_HOST}:${API_PORT}`;
      
    socketRef.current = io(socketUrl, {
      secure: true,
      transports: ['websocket', 'polling'],
      forceNew: true,
      upgrade: true,
    });

    socketRef.current.emit('joinRoom', buildingId);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveRoom', buildingId);
        socketRef.current.disconnect();
      }
    };
  }, [buildingId]);

  return socketRef.current;
};