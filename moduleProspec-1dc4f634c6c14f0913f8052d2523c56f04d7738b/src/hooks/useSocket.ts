import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (buildingId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!buildingId) return;

    socketRef.current = io(`https://${window.location.hostname}:3000`, {
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