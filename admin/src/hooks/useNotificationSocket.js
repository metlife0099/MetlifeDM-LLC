import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getAccessToken } from '@/api/client.js';

/**
 * Opens a Socket.io connection authenticated with the current access token
 * and keeps notification-related react-query caches live. The backend joins
 * this socket to the `admins` room (see backend/src/sockets/chat.socket.js)
 * whenever the token belongs to a staff role, so `notification:new` events
 * fire here in real time instead of waiting on the 60s topbar poll.
 */
export function useNotificationSocket() {
  const qc = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = io(undefined, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const onNew = (notif) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast(notif?.title || 'New notification', { icon: '🔔' });
    };

    socket.on('notification:new', onNew);

    return () => {
      socket.off('notification:new', onNew);
      socket.disconnect();
    };
  }, [qc]);
}

export default useNotificationSocket;
