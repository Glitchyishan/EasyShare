import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export const useSocket = (groupId?: string) => {
    const socketRef = useRef<Socket | null>(null);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (!token) return;

        // Connect to backend
        socketRef.current = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://easyshare-09ya.onrender.com', {
            auth: { token },
            transports: ['websocket'], // Force websocket
        });

        if (groupId) {
            socketRef.current.emit('group:join', groupId);
        }

        return () => {
            socketRef.current?.disconnect();
        };
    }, [token, groupId]);

    return socketRef.current;
};
