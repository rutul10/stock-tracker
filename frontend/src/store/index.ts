import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectionResponse } from '../api/types'
import type { UserProfile } from '../api/types'
import type { ThemeName } from '../styles/theme'

type Tab = 'watchboard' | 'news' | 'tracker'
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

  // Compare symbols
  compareSymbols: [string, string] | null
  setCompareSymbols: (symbols: [string, string]) => void
  clearCompareSymbols: () => void

  // Pin symbol (for comparison UX — first pin sets pinnedSymbol, second completes the pair)
  pinnedSymbol: string | null
  setPinnedSymbol: (symbol: string | null) => void

  // User profile
  userProfile: UserProfile
  setUserProfile: (profile: Partial<UserProfile>) => void
  hasSetProfile: boolean

  // Profile modal
  profileModalOpen: boolean
  setProfileModalOpen: (open: boolean) => void

  // Custom watchlists (persisted)
  customBlueChips: string[]
  customEmerging: string[]
  addToCustomBlueChips: (symbol: string) => void
  removeFromCustomBlueChips: (symbol: string) => void
  addToCustomEmerging: (symbol: string) => void
  removeFromCustomEmerging: (symbol: string) => void
}

const DEFAULT_USER_PROFILE: UserProfile = {
  riskTolerance: 'conservative',
  preferredDte: 'monthly',
  maxPositionSize: '',
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeTab: 'watchboard',
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

      // Compare symbols
      compareSymbols: null,
      setCompareSymbols: (symbols) => set({ compareSymbols: symbols }),
      clearCompareSymbols: () => set({ compareSymbols: null, pinnedSymbol: null }),

      // Pin symbol
      pinnedSymbol: null,
      setPinnedSymbol: (symbol) => set({ pinnedSymbol: symbol }),

      // User profile
      userProfile: DEFAULT_USER_PROFILE,
      setUserProfile: (profile) =>
        set((s) => ({
          userProfile: { ...s.userProfile, ...profile },
          hasSetProfile: true,
        })),
      hasSetProfile: false,

      // Profile modal
      profileModalOpen: false,
      setProfileModalOpen: (open) => set({ profileModalOpen: open }),

      // Custom watchlists
      customBlueChips: [],
      customEmerging: [],
      addToCustomBlueChips: (symbol) => {
        const upper = symbol.toUpperCase().trim()
        if (!upper || get().customBlueChips.includes(upper)) return
        set((s) => ({ customBlueChips: [...s.customBlueChips, upper] }))
      },
      removeFromCustomBlueChips: (symbol) =>
        set((s) => ({ customBlueChips: s.customBlueChips.filter((w) => w !== symbol) })),
      addToCustomEmerging: (symbol) => {
        const upper = symbol.toUpperCase().trim()
        if (!upper || get().customEmerging.includes(upper)) return
        set((s) => ({ customEmerging: [...s.customEmerging, upper] }))
      },
      removeFromCustomEmerging: (symbol) =>
        set((s) => ({ customEmerging: s.customEmerging.filter((w) => w !== symbol) })),
    }),
    {
      name: 'strategy-lab',
      partialize: (state) => ({
        watchlist: state.watchlist,
        theme: state.theme,
        selectedModels: state.selectedModels,
        autoAnalyze: state.autoAnalyze,
        userProfile: state.userProfile,
        hasSetProfile: state.hasSetProfile,
        customBlueChips: state.customBlueChips,
        customEmerging: state.customEmerging,
      }),
      // Migrate stored activeTab from old values to current valid tabs
      migrate: (stored: unknown) => {
        const s = stored as Partial<AppStore> & { activeTab?: string }
        const validTabs: Tab[] = ['watchboard', 'news', 'tracker']
        if (s.activeTab && !validTabs.includes(s.activeTab as Tab)) {
          s.activeTab = 'watchboard'
        }
        return s as AppStore
      },
      version: 2,
    }
  )
)
