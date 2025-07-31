import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (buildingId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!buildingId) return;

    const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
    const API_PORT = import.meta.env.VITE_API_PORT || '3000';
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    socketRef.current = io(`${protocol}://${SERVER_HOST}:${API_PORT}`, {
      secure: protocol === 'https',
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