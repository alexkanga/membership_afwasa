import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  hydrated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hydrated: false,
      login: (user) => set({ user, isAuthenticated: true, _hydrated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      isAdmin: () => get().user?.role === 'admin',
      hydrated: () => get()._hydrated,
    }),
    {
      name: 'aaea-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state._hydrated = true;
          }
        };
      },
    }
  )
);

interface DashboardState {
  currentPage: string;
  filters: DashboardFilters;
  setCurrentPage: (page: string) => void;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
}

export interface DashboardFilters {
  year: string;
  month: string;
  pays: string;
  zoneGeo: string;
  categorie: string;
  statutPaiement: string;
  statutActivation: string;
  typeAdhesion: string;
  modePaiement: string;
}

const defaultFilters: DashboardFilters = {
  year: '', month: '', pays: '', zoneGeo: '', categorie: '',
  statutPaiement: '', statutActivation: '', typeAdhesion: '', modePaiement: '',
};

export const useDashboardStore = create<DashboardState>()((set) => ({
  currentPage: 'executive',
  filters: defaultFilters,
  setCurrentPage: (page) => set({ currentPage: page }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
