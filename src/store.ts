import { create } from 'zustand';

export type Chain = 'ethereum' | 'polygon' | 'arbitrum';

export interface GasPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
}

export interface ChainState {
  baseFee: number;
  priorityFee: number;
  history: GasPoint[];
}

export interface AppState {
  mode: 'live' | 'simulation';
  chains: {
    ethereum: ChainState;
    polygon: ChainState;
    arbitrum: ChainState;
  };
  usdPrice: number;
  selectedChain: Chain;
  priceError: boolean;
  setMode: (mode: 'live' | 'simulation') => void;
  updateChain: (chain: Chain, data: Partial<ChainState>) => void;
  setUsdPrice: (price: number) => void;
  setPriceError: (hasError: boolean) => void;
  addGasPoint: (chain: Chain, point: GasPoint) => void;
  setSelectedChain: (chain: Chain) => void;
}

const initialChainState: ChainState = {
  baseFee: 0,
  priorityFee: 0,
  history: [],
};

export const useAppStore = create<AppState>((set) => ({
  mode: 'live',
  chains: {
    ethereum: { ...initialChainState },
    polygon: { ...initialChainState },
    arbitrum: { ...initialChainState },
  },
  usdPrice: 0,
  selectedChain: 'ethereum',
  priceError: false,
  setMode: (mode) => set({ mode }),
  updateChain: (chain, data) =>
    set((state) => ({
      chains: {
        ...state.chains,
        [chain]: { ...state.chains[chain], ...data },
      },
    })),
  setUsdPrice: (price) => set({ usdPrice: price }),
  setPriceError: (hasError) => set({ priceError: hasError }),
  addGasPoint: (chain, point) =>
    set((state) => ({
      chains: {
        ...state.chains,
        [chain]: {
          ...state.chains[chain],
          history: [...state.chains[chain].history, point],
        },
      },
    })),
  setSelectedChain: (chain) => set({ selectedChain: chain }),
})); 