import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/client.js';

export default function QueryProvider({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (
              query.state.data === undefined &&
              query.meta?.suppressErrorToast !== true &&
              error?.response?.status !== 401
            ) {
              toast.error(`Could not load data. ${getErrorMessage(error)}`, {
                id: `query-error-${query.queryHash}`,
              });
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
