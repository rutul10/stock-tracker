import { useState } from 'react'
import client from '../api/client'
import type { ProjectionRequest, ProjectionResponse } from '../api/types'

export function useProjection() {
  const [result, setResult] = useState<ProjectionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runProjection(req: ProjectionRequest) {
    setLoading(true)
    setError(null)
    try {
      const res = await client.post('/projection', req)
      setResult(res.data)
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axiosErr = e as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail ?? 'Projection failed')
      } else {
        setError('Projection failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, runProjection }
}
