export function uiStore(): string {
  return `import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen: true,
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}));
`;
}

export function storeIndex(hasAuth: boolean): string {
  const lines = hasAuth
    ? [`export { useAuthStore } from './auth.store';`, `export { useUiStore } from './ui.store';`]
    : [`export { useUiStore } from './ui.store';`];
  return lines.join('\n') + '\n';
}
