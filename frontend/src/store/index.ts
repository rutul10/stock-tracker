import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectionResponse } from '../api/types'
import type { ThemeName } from '../styles/theme'

type Tab = 'screener' | 'options' | 'indicators' | 'projector' | 'tracker'
export type ScreenerView = 'popular' | 'watchlist' | 'screener'

interface AppStore {
  // Navigation
  activeTab: Tab
  setActiveTab: (tab: Tab) => void

  // Symbol selection
  selectedSymbol: string
  setSelectedSymbol: (symbol: string) => void

  // Stock detail overlay (ephemeral — not persisted)
  detailSymbol: string | null
  detailPrice: number | null
  setDetailSymbol: (symbol: string | null, price?: number | null) => void

  // AI projection
  lastProjection: ProjectionResponse | null
  setLastProjection: (p: ProjectionResponse | null) => void

  // Screener
  activeScreenerView: ScreenerView
  setActiveScreenerView: (view: ScreenerView) => void
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void

  // Theme
  theme: ThemeName
  setTheme: (t: ThemeName) => void

  // Multi-model projection
  selectedModels: string[]
  setSelectedModels: (models: string[]) => void
  autoAnalyze: boolean
  setAutoAnalyze: (v: boolean) => void

  // Available Ollama models (ephemeral — fetched at runtime, not persisted)
  availableModels: string[]
  setAvailableModels: (models: string[]) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeTab: 'screener',
      setActiveTab: (tab) => set({ activeTab: tab }),

      selectedSymbol: '',
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

      detailSymbol: null,
      detailPrice: null,
      setDetailSymbol: (symbol, price = null) => set({ detailSymbol: symbol, detailPrice: price }),

      lastProjection: null,
      setLastProjection: (p) => set({ lastProjection: p }),

      activeScreenerView: 'popular',
      setActiveScreenerView: (view) => set({ activeScreenerView: view }),

      watchlist: [],
      addToWatchlist: (symbol) => {
        const upper = symbol.toUpperCase().trim()
        if (!upper || get().watchlist.includes(upper)) return
        set((s) => ({ watchlist: [...s.watchlist, upper] }))
      },
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),

      theme: 'dark',
      setTheme: (t) => set({ theme: t }),

      selectedModels: [],
      setSelectedModels: (models) => set({ selectedModels: models }),

      autoAnalyze: false,
      setAutoAnalyze: (v) => set({ autoAnalyze: v }),

      availableModels: [],
      setAvailableModels: (models) => set({ availableModels: models }),
    }),
    {
      name: 'stock-tracker-store',
      partialize: (state) => ({
        watchlist: state.watchlist,
        theme: state.theme,
        selectedModels: state.selectedModels,
        autoAnalyze: state.autoAnalyze,
      }),
    }
  )
)
