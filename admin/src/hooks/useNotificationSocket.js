import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getAccessToken } from '@/api/client.js';

/**
 * Vite's dev-server `server.proxy` (`ws: true`) does not cleanly proxy a raw
 * WebSocket upgrade — every time the connection cycles (HMR, tab reload, idle
 * timeout) it logs a benign-but-noisy "ws proxy socket error: ECONNABORTED"
 * and can leave the client stuck reconnecting through a half-dead tunnel. The
 * fix is to skip the Vite proxy for this connection in dev and talk to the
 * backend origin directly; production serves both from behind a real reverse
 * proxy, so same-origin (undefined) is correct there.
 */
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.DEV) return import.meta.env.VITE_API_URL_PROXY || 'http://localhost:5000';
  return undefined;
};

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

    const socket = io(getSocketUrl(), {
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
