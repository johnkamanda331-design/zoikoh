import { create } from 'zustand';

interface IceBreakersPanelState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useIceBreakersPanelStore = create<IceBreakersPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
