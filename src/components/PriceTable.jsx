import { ExternalLink, CheckCircle, HelpCircle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

const CATEGORY_ICONS = {
  'Lääkärikäynti': '🩺',
  'Laboratoriotutkimukset': '🧪',
  'Kuvantaminen': '📷',
  'Toimenpiteet': '✂️',
}

function TrendBadge({ history, currentPrice }) {
  if (!history || history.length === 0 || currentPrice === null) return null
  const prev = history[history.length - 1]?.price
  if (!prev || prev === currentPrice) return null
  const pct = Math.round(Math.abs(currentPrice - prev) / prev * 100)
  if (currentPrice > prev)
    return <TrendingUp size={10} className="text-red-400 shrink-0" title={`+${pct}% edellisestä`} />
  return <TrendingDown size={10} className="text-green-500 shrink-0" title={`-${pct}% edellisestä`} />
}

function Tooltip({ text }) {
  if (!text) return null
  return (
    <div className="group relative inline-flex">
      <Info size={11} className="text-slate-300 hover:text-slate-500 cursor-help" />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      w-52 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl
                      opacity-0 group-hover:opacity-100 transition-opacity leading-relaxed">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  )
}

function PriceBadge({ priceObj, isLowest, isHighest, insurancePct, adminMode, onEdit }) {
  if (!priceObj || priceObj.price === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-slate-300 text-sm">–</span>
        {adminMode && (
          <button onClick={onEdit}
            className="text-xs px-1.5 py-0.5 rounded border border-brand-300 text-brand-600 hover:bg-brand-50">
            Lisää
          </button>
        )}
      </div>
    )
  }

  const bgClass = isLowest
    ? 'bg-green-50 text-green-700 border-green-200'
    : isHighest
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-50 text-slate-700 border-slate-200'

  const netPrice = insurancePct > 0
    ? Math.round(priceObj.price * (1 - insurancePct / 100))
    : null

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`inline-flex flex-col items-center px-2.5 py-1.5 rounded-lg border ${bgClass}`}>
        {/* Hinta + trendi */}
        <div className="flex items-center gap-1">
          <span className="font-bold text-base tabular-nums">{priceObj.price} €</span>
          <TrendBadge history={priceObj.history} currentPrice={priceObj.price} />
          <Tooltip text={priceObj.note} />
        </div>

        {/* Omavastuu */}
        {netPrice !== null && (
          <span className="text-xs opacity-70 tabular-nums">omavastuu {netPrice} €</span>
        )}

        {/* Vahvistettu / arvio */}
        {priceObj.verified ? (
          <span className="flex items-center gap-0.5 text-xs text-green-600 mt-0.5">
            <CheckCircle size={9} /> vahvistettu
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
            <HelpCircle size={9} /> arvio
          </span>
        )}
      </div>

      {adminMode && (
        <button onClick={onEdit}
          className="text-xs px-1.5 py-0.5 rounded border border-brand-300 text-brand-600 hover:bg-brand-50">
          Muokkaa
        </button>
      )}
    </div>
  )
}

export default function PriceTable({ services, providers, insurancePct, adminMode, onEditPrice, overrides }) {
  if (services.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        Ei hakutuloksia. Kokeile eri hakusanaa tai kategoriaa.
      </div>
    )
  }

  // Ryhmittele kategorioittain
  const grouped = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const cols = `2fr repeat(${providers.length}, 1fr)`

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        {/* Sticky provider header */}
        <div className="grid gap-0 sticky top-0 z-20 shadow-sm" style={{ gridTemplateColumns: cols }}>
          <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Palvelu
          </div>
          {providers.map(p => (
            <div key={p.id} className="px-2 py-3 bg-slate-100 border-b border-slate-200 text-center">
              <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-1 group">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                  style={{ backgroundColor: p.color }}
                >
                  {p.logo}
                </span>
                <span className="text-xs font-medium text-slate-700 group-hover:text-brand-600 flex items-center gap-0.5 leading-tight text-center">
                  {p.name}
                  <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* Kategorioittain ryhmitelty */}
        {Object.entries(grouped).map(([category, catServices]) => (
          <div key={category}>
            {/* Kategoriaotsikko */}
            <div className="grid gap-0" style={{ gridTemplateColumns: cols }}>
              <div className="col-span-full px-5 py-2 bg-brand-50 border-y border-brand-100 flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[category] ?? '📋'}</span>
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{category}</span>
                <span className="text-xs text-brand-400 ml-1">({catServices.length} palvelua)</span>
              </div>
            </div>

            {/* Palvelurivit */}
            {catServices.map((service, idx) => {
              const allPrices = providers
                .map(p => {
                  const ov = overrides?.[`${service.id}__${p.id}`]
                  return ov?.price ?? service.prices[p.id]?.price
                })
                .filter(v => v !== null && v !== undefined)
              const minPrice = allPrices.length ? Math.min(...allPrices) : null
              const maxPrice = allPrices.length ? Math.max(...allPrices) : null
              const saving = minPrice !== null && maxPrice !== null && minPrice !== maxPrice
                ? maxPrice - minPrice : null

              return (
                <div
                  key={service.id}
                  className={`grid gap-0 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 transition-colors
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  style={{ gridTemplateColumns: cols }}
                >
                  {/* Palvelun nimi */}
                  <div className="px-5 py-4 flex flex-col justify-center">
                    <span className="font-medium text-slate-800 text-sm leading-snug">{service.name}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{service.description}</span>
                    {saving !== null && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1.5">
                        <TrendingDown size={11} />
                        Säästä jopa {saving} € valitsemalla halvin
                      </span>
                    )}
                  </div>

                  {/* Hinnat */}
                  {providers.map(p => {
                    const base = service.prices[p.id]
                    const override = overrides?.[`${service.id}__${p.id}`]
                    const priceObj = override ? { ...base, ...override } : base
                    const effectivePrice = priceObj?.price ?? null
                    const isLowest = effectivePrice !== null && effectivePrice === minPrice && allPrices.length > 1
                    const isHighest = effectivePrice !== null && effectivePrice === maxPrice && allPrices.length > 1 && minPrice !== maxPrice

                    return (
                      <div key={p.id} className="px-2 py-4 flex items-center justify-center">
                        <PriceBadge
                          priceObj={priceObj}
                          isLowest={isLowest}
                          isHighest={isHighest}
                          insurancePct={insurancePct}
                          adminMode={adminMode}
                          onEdit={() => onEditPrice(service, p, priceObj)}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        🟢 Halvin &nbsp;·&nbsp; 🔴 Kallein &nbsp;·&nbsp; ↑↓ Hinnan muutos &nbsp;·&nbsp; ℹ️ Hover = hintaerittely
      </p>
    </div>
  )
}
