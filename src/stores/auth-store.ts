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

export interface DashboardFilters {
  dateDebut: string;
  dateFin: string;
  typeDate: string;
  continent: string;
  regionAfrique: string;
  planAdhesion: string;
}

const defaultFilters: DashboardFilters = {
  dateDebut: '',
  dateFin: '',
  typeDate: 'inscription',
  continent: '',
  regionAfrique: '',
  planAdhesion: '',
};

interface DashboardState {
  currentPage: string;
  filters: DashboardFilters;
  appliedFilters: DashboardFilters;
  setCurrentPage: (page: string) => void;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  currentPage: 'executive',
  filters: defaultFilters,
  appliedFilters: defaultFilters,
  setCurrentPage: (page) => set({ currentPage: page }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters, appliedFilters: defaultFilters }),
  applyFilters: () => set((state) => ({ appliedFilters: { ...state.filters } })),
}));