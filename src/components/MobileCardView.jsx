import { ExternalLink, CheckCircle, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function TrendBadge({ history, currentPrice }) {
  if (!history || history.length === 0 || currentPrice === null) return null
  const prev = history[history.length - 1]?.price
  if (!prev || prev === currentPrice) return <Minus size={12} className="text-slate-400" />
  if (currentPrice > prev) return <TrendingUp size={12} className="text-red-500" />
  return <TrendingDown size={12} className="text-green-500" />
}

export default function MobileCardView({ services, providers, insurancePct, adminMode, onEditPrice, overrides }) {
  if (services.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
        Ei hakutuloksia. Kokeile eri hakusanaa tai kategoriaa.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {services.map(service => {
        const allPrices = providers
          .map(p => {
            const override = overrides?.[`${service.id}__${p.id}`]
            return override?.price ?? service.prices[p.id]?.price
          })
          .filter(v => v !== null && v !== undefined)
        const minPrice = allPrices.length ? Math.min(...allPrices) : null
        const maxPrice = allPrices.length ? Math.max(...allPrices) : null

        return (
          <div key={service.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="font-semibold text-slate-800 text-sm">{service.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
              {minPrice !== null && maxPrice !== null && minPrice !== maxPrice && (
                <p className="text-xs text-brand-600 mt-1">
                  {minPrice}–{maxPrice} € · säästöpotentiaali {maxPrice - minPrice} €
                </p>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {providers.map(p => {
                const base = service.prices[p.id]
                const override = overrides?.[`${service.id}__${p.id}`]
                const priceObj = override ? { ...base, ...override } : base
                const effectivePrice = priceObj?.price ?? null
                const isLowest = effectivePrice !== null && effectivePrice === minPrice && allPrices.length > 1
                const isHighest = effectivePrice !== null && effectivePrice === maxPrice && allPrices.length > 1 && minPrice !== maxPrice
                const netPrice = effectivePrice !== null && insurancePct > 0
                  ? Math.round(effectivePrice * (1 - insurancePct / 100))
                  : null

                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.logo}
                      </span>
                      <div>
                        <a
                          href={p.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center gap-1"
                        >
                          {p.name} <ExternalLink size={10} />
                        </a>
                        {priceObj?.lastChanged && (
                          <p className="text-xs text-slate-400">{priceObj.lastChanged}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {effectivePrice === null ? (
                        <span className="text-slate-400 text-sm italic">–</span>
                      ) : (
                        <div className={`text-right px-2 py-1 rounded-lg border text-sm ${
                          isLowest ? 'bg-green-50 text-green-700 border-green-200'
                          : isHighest ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-1 font-semibold">
                            {effectivePrice} €
                            <TrendBadge history={base?.history} currentPrice={effectivePrice} />
                          </div>
                          {netPrice !== null && (
                            <div className="text-xs opacity-75">omavastuu {netPrice} €</div>
                          )}
                          <div className="flex items-center gap-0.5 text-xs justify-end mt-0.5">
                            {priceObj.verified
                              ? <><CheckCircle size={9} className="text-green-600" /><span className="text-green-600">vahvistettu</span></>
                              : <><HelpCircle size={9} className="text-slate-400" /><span className="text-slate-400">arvio</span></>
                            }
                          </div>
                        </div>
                      )}
                      {adminMode && (
                        <button
                          onClick={() => onEditPrice(service, p, priceObj)}
                          className="text-xs px-2 py-1 rounded border border-brand-300 text-brand-600 hover:bg-brand-50"
                        >
                          Muokkaa
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-slate-400 text-center">
        Vihreä = halvin · Punainen = kallein · Arvio = hintaa ei vahvistettu
      </p>
    </div>
  )
}
