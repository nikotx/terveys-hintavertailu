import { ExternalLink, CheckCircle, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function TrendBadge({ history, currentPrice }) {
  if (!history || history.length === 0 || currentPrice === null) return null
  const prev = history[history.length - 1]?.price
  if (!prev || prev === currentPrice) return <Minus size={10} className="text-slate-400" title="Ei muutosta" />
  const pct = Math.round(Math.abs(currentPrice - prev) / prev * 100)
  if (currentPrice > prev)
    return <TrendingUp size={10} className="text-red-500" title={`+${pct}% edellisestä`} />
  return <TrendingDown size={10} className="text-green-500" title={`-${pct}% edellisestä`} />
}

function PriceBadge({ priceObj, isLowest, isHighest, insurancePct, adminMode, onEdit }) {
  if (!priceObj || priceObj.price === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-slate-400 text-sm italic">–</span>
        {adminMode && (
          <button
            onClick={onEdit}
            className="text-xs px-1.5 py-0.5 rounded border border-brand-300 text-brand-600 hover:bg-brand-50"
          >
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
      <div className={`inline-flex flex-col items-center px-3 py-1.5 rounded-lg border ${bgClass}`}>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base">{priceObj.price} €</span>
          <TrendBadge history={priceObj.history} currentPrice={priceObj.price} />
        </div>
        {netPrice !== null && (
          <span className="text-xs opacity-70">omavastuu {netPrice} €</span>
        )}
        {priceObj.lastChanged && (
          <span className="text-xs opacity-50 mt-0.5">{priceObj.lastChanged}</span>
        )}
        {priceObj.verified ? (
          <span className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
            <CheckCircle size={10} /> vahvistettu
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <HelpCircle size={10} /> arvio
          </span>
        )}
      </div>
      {adminMode && (
        <button
          onClick={onEdit}
          className="text-xs px-1.5 py-0.5 rounded border border-brand-300 text-brand-600 hover:bg-brand-50"
        >
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

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Provider header */}
        <div className="grid gap-0" style={{ gridTemplateColumns: `2fr repeat(${providers.length}, 1fr)` }}>
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Palvelu
          </div>
          {providers.map(p => (
            <div key={p.id} className="px-2 py-3 bg-slate-50 border-b border-slate-200 text-center">
              <a
                href={p.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-1 group"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.logo}
                </span>
                <span className="text-xs font-medium text-slate-700 group-hover:text-brand-600 flex items-center gap-0.5">
                  {p.name}
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* Service rows */}
        {services.map((service, idx) => {
          const allPrices = providers
            .map(p => {
              const override = overrides?.[`${service.id}__${p.id}`]
              return override?.price ?? service.prices[p.id]?.price
            })
            .filter(v => v !== null && v !== undefined)
          const minPrice = allPrices.length ? Math.min(...allPrices) : null
          const maxPrice = allPrices.length ? Math.max(...allPrices) : null

          return (
            <div
              key={service.id}
              className={`grid gap-0 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}
              style={{ gridTemplateColumns: `2fr repeat(${providers.length}, 1fr)` }}
            >
              <div className="px-5 py-4 flex flex-col justify-center">
                <span className="font-medium text-slate-800 text-sm">{service.name}</span>
                <span className="text-xs text-slate-500 mt-0.5">{service.description}</span>
                {minPrice !== null && maxPrice !== null && allPrices.length > 1 && (
                  <span className="text-xs text-brand-600 mt-1">
                    {minPrice}–{maxPrice} € · säästöpotentiaali {maxPrice - minPrice} €
                  </span>
                )}
              </div>

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

      <p className="text-xs text-slate-400 text-center">
        Vihreä = halvin vaihtoehto · Punainen = kallein vaihtoehto · ↑↓ = hintasuunta edellisestä tarkistuksesta
      </p>
    </div>
  )
}
