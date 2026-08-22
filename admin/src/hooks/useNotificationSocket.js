import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getAccessToken } from '@/api/client.js';
import { getSocketUrl } from '@/utils/socket.js';

const RESOURCE_QUERY_KEYS = {
  application: 'applications',
  chat: 'chats',
  comment: 'comments',
  consultation: 'consultations',
  contact: 'contacts',
  order: 'orders',
  partner_inquiry: 'partners',
  pricing_enquiry: 'pricing-enquiries',
  subscriber: 'subscribers',
  ticket: 'tickets',
  user: 'users',
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
    if (import.meta.env.VITE_ENABLE_REALTIME === 'false') return undefined;
    const token = getAccessToken();
    if (!token) return undefined;

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const onNew = (notif) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      const resourceKey = RESOURCE_QUERY_KEYS[notif?.resourceType];
      if (resourceKey) qc.invalidateQueries({ queryKey: ['admin', resourceKey] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
