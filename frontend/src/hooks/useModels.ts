import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAppStore } from '../store'

export function useModels() {
  const { availableModels, setAvailableModels } = useAppStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (availableModels.length > 0) return
    let cancelled = false
    setLoading(true)
    axios.get('/api/models')
      .then((res) => {
        if (!cancelled) setAvailableModels(res.data?.models ?? [])
      })
      .catch(() => {
        if (!cancelled) setAvailableModels([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [availableModels.length, setAvailableModels])

  return { models: availableModels, loading }
}
