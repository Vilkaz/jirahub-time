import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface JiraConnection {
  isConnected: boolean;
  username?: string;
  instanceUrl: string;
  lastSync?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface JiraState {
  connection: JiraConnection | null;
  isConnecting: boolean;
  connectionError: string | null;

  // Actions
  setConnection: (connection: JiraConnection) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  disconnect: () => void;
  updateLastSync: () => void;
}

export const useJiraStore = create<JiraState>()(
  persist(
    (set, get) => ({
      connection: null,
      isConnecting: false,
      connectionError: null,

      setConnection: (connection) => set({
        connection,
        isConnecting: false,
        connectionError: null
      }),

      setConnecting: (isConnecting) => set({ isConnecting }),

      setConnectionError: (connectionError) => set({
        connectionError,
        isConnecting: false
      }),

      disconnect: () => set({
        connection: null,
        isConnecting: false,
        connectionError: null
      }),

      updateLastSync: () => {
        const current = get().connection;
        if (current) {
          set({
            connection: {
              ...current,
              lastSync: new Date().toISOString()
            }
          });
        }
      },
    }),
    {
      name: 'jira-connection-storage',
      partialize: (state) => ({
        connection: state.connection
      }),
    }
  )
);