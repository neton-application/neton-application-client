"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export interface FrontClientContextValue {
  permissions: string[];
  roles: string[];
}

const FrontClientContext = React.createContext<FrontClientContextValue | null>(null);

function permissionMatches(granted: string, expected: string): boolean {
  if (granted === "*" || granted === "*:*:*" || granted === expected) return true;
  const grantedParts = granted.split(":");
  const expectedParts = expected.split(":");
  return grantedParts.length === expectedParts.length
    && grantedParts.every((part, index) => part === "*" || part === expectedParts[index]);
}

export function FrontClientProvider({
  children,
  permissions,
  roles,
}: FrontClientContextValue & { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 15_000,
      },
    },
  }));

  const contextValue = React.useMemo(() => ({ permissions, roles }), [permissions, roles]);

  return (
    <QueryClientProvider client={queryClient}>
      <FrontClientContext.Provider value={contextValue}>
        {children}
      </FrontClientContext.Provider>
    </QueryClientProvider>
  );
}

export function useFrontClient(): FrontClientContextValue {
  const value = React.useContext(FrontClientContext);
  if (!value) throw new Error("useFrontClient must be used inside FrontClientProvider");
  return value;
}

export function usePermission(permission?: string): boolean {
  const { permissions } = useFrontClient();
  if (!permission) return true;
  return permissions.some((granted) => permissionMatches(granted, permission));
}

export { useMutation, useQuery, useQueryClient };
