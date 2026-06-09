import { useState } from 'react'
import { X } from 'lucide-react'

export default function AdminEditModal({ service, provider, current, onSave, onClose }) {
  const [price, setPrice] = useState(current?.price ?? '')
  const [source, setSource] = useState(current?.source ?? '')
  const [verified, setVerified] = useState(current?.verified ?? false)

  const handleSave = () => {
    const parsed = price === '' ? null : Number(price)
    if (price !== '' && isNaN(parsed)) return
    onSave({
      price: parsed,
      unit: current?.unit ?? '€/käynti',
      source: source || 'manuaalinen',
      verified,
      lastChanged: new Date().toISOString().slice(0, 10),
      history: current?.history ?? [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{service.name}</h2>
            <p className="text-sm text-slate-500">{provider.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Hinta (€) – tyhjä = ei saatavilla</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="esim. 95"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Lähde</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="esim. mehilainen.fi 2026-06-09"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-700">Hinta vahvistettu</span>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            Peruuta
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm bg-brand-600 text-white rounded-xl hover:bg-brand-700"
          >
            Tallenna
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Tallennetaan selaimeen. Vie JSON exportoimalla.
        </p>
      </div>
    </div>
  )
}
