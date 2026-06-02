export function swrConfig(): string {
  return `import { SWRConfig } from 'swr';

import { apiFetch } from '@/lib/api';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => apiFetch(url),
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
`;
}

export function swrHookExample(): string {
  return `import useSWR from 'swr';

import type { ApiError } from '@/types';

export function useUser(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ id: string; name: string }, ApiError>(
    id ? \`/users/\${id}/\` : null,
  );

  return { user: data, error, isLoading, mutate };
}
`;
}

export function queryProvider(): string {
  return `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
`;
}

export function queryHookExample(): string {
  return `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiFetch<{ id: string; name: string }>(\`/users/\${id}/\`),
    enabled: Boolean(id),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiFetch<{ id: string; name: string }>(\`/users/\${id}/\`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: updatedUser => {
      queryClient.setQueryData(userKeys.detail(id), updatedUser);
    },
  });
}
`;
}
