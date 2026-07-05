/**
 * Vite's dev-server `server.proxy` (`ws: true`) does not cleanly proxy a raw
 * WebSocket upgrade — every time the connection cycles (HMR, tab reload, idle
 * timeout) it logs a benign-but-noisy "ws proxy socket error: ECONNABORTED"
 * and can leave the client stuck reconnecting through a half-dead tunnel. The
 * fix is to skip the Vite proxy for socket connections in dev and talk to the
 * backend origin directly; production serves both from behind a real reverse
 * proxy, so same-origin (undefined) is correct there.
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.DEV) return import.meta.env.VITE_API_URL_PROXY || 'http://localhost:5000';
  return undefined;
};

export default getSocketUrl;
