import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/index.js';
import { DEFAULT_PUBLIC_SETTINGS, normalizePublicSettings } from '@/utils/publicSettings.js';

const PublicSettingsContext = createContext(DEFAULT_PUBLIC_SETTINGS);

export default function PublicSettingsProvider({ children }) {
  const { data } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: settingsApi.getPublic,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const settings = useMemo(() => normalizePublicSettings(data?.settings, {
    ga4Id: import.meta.env.VITE_GA4_ID,
    gtmId: import.meta.env.VITE_GTM_ID,
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
  }), [data?.settings]);

  return (
    <PublicSettingsContext.Provider value={settings}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export const usePublicSettings = () => useContext(PublicSettingsContext);
