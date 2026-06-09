import { Trophy, TrendingDown, CheckCircle } from 'lucide-react'

export default function SummaryStats({ services, providers, overrides }) {
  // Laske halvin toimija (eniten halvimpia hintoja)
  const wins = {}
  providers.forEach(p => { wins[p.id] = 0 })

  services.forEach(service => {
    const prices = providers.map(p => {
      const ov = overrides?.[`${service.id}__${p.id}`]
      return { id: p.id, price: ov?.price ?? service.prices[p.id]?.price ?? null }
    }).filter(x => x.price !== null)
    if (prices.length < 2) return
    const min = Math.min(...prices.map(x => x.price))
    prices.filter(x => x.price === min).forEach(x => wins[x.id]++)
  })

  const topProvider = providers.reduce((best, p) =>
    wins[p.id] > (wins[best?.id] ?? -1) ? p : best, null)

  // Suurin säästöpotentiaali
  let biggestSaving = 0
  let biggestSavingService = null
  services.forEach(service => {
    const prices = providers
      .map(p => {
        const ov = overrides?.[`${service.id}__${p.id}`]
        return ov?.price ?? service.prices[p.id]?.price ?? null
      })
      .filter(v => v !== null)
    if (prices.length < 2) return
    const saving = Math.max(...prices) - Math.min(...prices)
    if (saving > biggestSaving) {
      biggestSaving = saving
      biggestSavingService = service
    }
  })

  // Vahvistetut hinnat
  let verified = 0, total = 0
  services.forEach(service => {
    providers.forEach(p => {
      const po = service.prices[p.id]
      if (po?.price !== null && po?.price !== undefined) {
        total++
        if (po.verified) verified++
      }
    })
  })

  const stats = [
    {
      icon: <Trophy size={16} className="text-amber-500" />,
      label: 'Halvin toimija',
      value: topProvider?.name ?? '–',
      sub: topProvider ? `${wins[topProvider.id]} halvinta hintaa` : '',
      color: 'bg-amber-50 border-amber-200',
    },
    {
      icon: <TrendingDown size={16} className="text-green-600" />,
      label: 'Suurin säästö',
      value: biggestSaving ? `${biggestSaving} €` : '–',
      sub: biggestSavingService?.name ?? '',
      color: 'bg-green-50 border-green-200',
    },
    {
      icon: <CheckCircle size={16} className="text-brand-600" />,
      label: 'Vahvistetut hinnat',
      value: `${verified} / ${total}`,
      sub: total ? `${Math.round(verified / total * 100)} % tarkistettu` : '',
      color: 'bg-blue-50 border-blue-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.color}`}>
          <div className="shrink-0">{s.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 leading-none mb-1">{s.label}</p>
            <p className="font-bold text-slate-900 text-sm truncate">{s.value}</p>
            {s.sub && <p className="text-xs text-slate-500 truncate mt-0.5">{s.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
