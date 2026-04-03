"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ClientContextValue {
  selectedClientId: string | null; // null = "All clients"
  selectedClientName: string | null;
  setSelectedClient: (id: string | null, name: string | null) => void;
}

const ClientContext = createContext<ClientContextValue>({
  selectedClientId: null,
  selectedClientName: null,
  setSelectedClient: () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  const setSelectedClient = useCallback(
    (id: string | null, name: string | null) => {
      setSelectedClientId(id);
      setSelectedClientName(name);
    },
    []
  );

  return (
    <ClientContext.Provider
      value={{ selectedClientId, selectedClientName, setSelectedClient }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  return useContext(ClientContext);
}
