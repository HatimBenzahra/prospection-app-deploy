import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config';

export const useSocket = (buildingId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!buildingId) return;

    const socketUrl = SOCKET_URL;
      
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