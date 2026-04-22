import { create } from 'zustand'
import type { ProjectionResponse } from '../api/types'

type Tab = 'screener' | 'options' | 'indicators' | 'projector' | 'tracker'

interface AppStore {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  selectedSymbol: string
  setSelectedSymbol: (symbol: string) => void
  lastProjection: ProjectionResponse | null
  setLastProjection: (p: ProjectionResponse | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'screener',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedSymbol: '',
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  lastProjection: null,
  setLastProjection: (p) => set({ lastProjection: p }),
}))
