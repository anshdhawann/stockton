const N8N_BASE_URL_KEY = 'stockton_n8n_base_url'
const N8N_API_KEY_KEY = 'stockton_n8n_api_key'

export function getN8nConfig() {
  return {
    baseUrl: localStorage.getItem(N8N_BASE_URL_KEY) || '',
    apiKey: localStorage.getItem(N8N_API_KEY_KEY) || '',
  }
}

export function saveN8nConfig({ baseUrl, apiKey }) {
  localStorage.setItem(N8N_BASE_URL_KEY, String(baseUrl || '').trim())
  localStorage.setItem(N8N_API_KEY_KEY, String(apiKey || '').trim())
}

export async function fetchN8nWorkflows({ baseUrl, apiKey }) {
  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/, '')
  const normalizedApiKey = String(apiKey || '').trim()

  if (!normalizedBaseUrl || !normalizedApiKey) {
    throw new Error('Missing n8n URL or API key')
  }

  const url = `${normalizedBaseUrl}/api/v1/workflows?limit=250`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': normalizedApiKey,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`n8n API error ${response.status}: ${body.slice(0, 200)}`)
  }

  const payload = await response.json()
  const workflows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : []

  return workflows
}
