import axios, { type AxiosError } from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Retry up to 3 times on network errors or 5xx, with exponential backoff
client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (typeof error.config & { _retryCount?: number }) | undefined
  if (!config) return Promise.reject(error)

  const status = error.response?.status ?? 0
  const isRetryable = !error.response || status >= 500
  if (!isRetryable) return Promise.reject(error)

  config._retryCount = (config._retryCount ?? 0) + 1
  if (config._retryCount > 3) return Promise.reject(error)

  await new Promise((r) => setTimeout(r, 300 * config._retryCount!))
  return client(config)
})

export default client
