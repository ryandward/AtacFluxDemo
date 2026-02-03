import { create } from 'zustand';

/**
 * Global selection state for cross-component coordination.
 * Tracks selected epigenome layer, gene, and reaction.
 */
export const useSelectionStore = create((set, get) => ({
  // Selection state
  selectedLayer: null,       // e.g., 'ATAC-seq', 'Hi-C', 'ChIP-seq', 'RNA-seq'
  selectedGene: null,        // e.g., 'ATF1', 'BAT2'
  selectedReaction: 'r_0160', // Default to first reaction

  // Actions - toggle behavior (click again to deselect)
  selectLayer: (layer) => set((state) => ({
    selectedLayer: state.selectedLayer === layer ? null : layer,
  })),

  selectGene: (gene) => set((state) => ({
    selectedGene: state.selectedGene === gene ? null : gene,
  })),

  selectReaction: (reaction) => set((state) => ({
    selectedReaction: state.selectedReaction === reaction ? null : reaction,
  })),

  // Clear all selections
  clearSelection: () => set({
    selectedLayer: null,
    selectedGene: null,
    selectedReaction: null,
  }),
}));
