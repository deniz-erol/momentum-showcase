import { create } from 'zustand';
import { Holding } from '@/types';

interface PortfolioState {
    // We keep mostly UI state here, data is in React Query
    selectedAssetId: string | null;
    isAddModalOpen: boolean;
    editingHolding: Holding | null;

    setSelectedAssetId: (id: string | null) => void;
    setAddModalOpen: (isOpen: boolean) => void;
    setEditingHolding: (holding: Holding | null) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
    selectedAssetId: null,
    isAddModalOpen: false,
    editingHolding: null,

    setSelectedAssetId: (id) => set({ selectedAssetId: id }),
    setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
    setEditingHolding: (holding) => set({
        editingHolding: holding,
        isAddModalOpen: !!holding // Automatically open modal when editing
    }),
}));
