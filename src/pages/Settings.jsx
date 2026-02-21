import React, { useState } from 'react'
import { saveN8nConfig, getN8nConfig } from '../utils/n8n'

function Settings() {
  const initial = getN8nConfig()
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [saved, setSaved] = useState(false)

  function handleSave(event) {
    event.preventDefault()
    saveN8nConfig({ baseUrl, apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Configure integrations for Stockton</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">n8n Integration</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">n8n Base URL</label>
          <input
            className="input"
            placeholder="https://your-n8n-instance.com or .../home/workflows"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">n8n API Key</label>
          <input
            className="input"
            type="password"
            placeholder="n8n_api_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Save</button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>

        <p className="text-xs text-gray-500">
          These values are stored in browser local storage. Workflows can load via secure proxy; direct URL/API key are optional fallback.
        </p>
      </form>
    </div>
  )
}

export default Settings
