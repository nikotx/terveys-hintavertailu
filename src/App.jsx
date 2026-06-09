import { useState, useMemo, useCallback } from 'react'
import { Activity } from 'lucide-react'
import pricesData from './data/prices.json'
import FilterBar from './components/FilterBar'
import PriceTable from './components/PriceTable'
import MobileCardView from './components/MobileCardView'
import LastUpdatedBanner from './components/LastUpdatedBanner'
import AdminEditModal from './components/AdminEditModal'
import SummaryStats from './components/SummaryStats'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWindowSize } from './hooks/useWindowSize'

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('Kaikki')
  const [sortBy, setSortBy] = useState('name')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInsurance, setShowInsurance] = useState(false)
  const [insurancePct, setInsurancePct] = useState(0)
  const [adminMode, setAdminMode] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // { service, provider, current }
  const [overrides, setOverrides] = useLocalStorage('price-overrides', {})

  const { isMobile } = useWindowSize()

  const categories = useMemo(() => {
    const cats = [...new Set(pricesData.services.map(s => s.category))]
    return ['Kaikki', ...cats]
  }, [])

  const filteredServices = useMemo(() => {
    let services = pricesData.services

    if (selectedCategory !== 'Kaikki') {
      services = services.filter(s => s.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      services = services.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'cheapest') {
      services = [...services].sort((a, b) => {
        const aMin = Math.min(...pricesData.providers.map(p => {
          const ov = overrides[`${a.id}__${p.id}`]
          return (ov?.price ?? a.prices[p.id]?.price) ?? Infinity
        }))
        const bMin = Math.min(...pricesData.providers.map(p => {
          const ov = overrides[`${b.id}__${p.id}`]
          return (ov?.price ?? b.prices[p.id]?.price) ?? Infinity
        }))
        return aMin - bMin
      })
    } else if (sortBy === 'expensive') {
      services = [...services].sort((a, b) => {
        const aMin = Math.min(...pricesData.providers.map(p => {
          const ov = overrides[`${a.id}__${p.id}`]
          return (ov?.price ?? a.prices[p.id]?.price) ?? Infinity
        }))
        const bMin = Math.min(...pricesData.providers.map(p => {
          const ov = overrides[`${b.id}__${p.id}`]
          return (ov?.price ?? b.prices[p.id]?.price) ?? Infinity
        }))
        return bMin - aMin
      })
    }

    return services
  }, [selectedCategory, sortBy, searchQuery, overrides])

  const handleEditPrice = useCallback((service, provider, current) => {
    setEditTarget({ service, provider, current })
  }, [])

  const handleSaveEdit = useCallback((newPriceObj) => {
    const key = `${editTarget.service.id}__${editTarget.provider.id}`
    setOverrides(prev => ({ ...prev, [key]: newPriceObj }))
  }, [editTarget, setOverrides])

  const handleExportJson = useCallback(() => {
    const merged = {
      ...pricesData,
      lastUpdated: new Date().toISOString().slice(0, 10),
      services: pricesData.services.map(service => ({
        ...service,
        prices: Object.fromEntries(
          pricesData.providers.map(p => {
            const key = `${service.id}__${p.id}`
            const override = overrides[key]
            return [p.id, override ? { ...service.prices[p.id], ...override } : service.prices[p.id]]
          })
        )
      }))
    }
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prices-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [overrides])

  const overrideCount = Object.keys(overrides).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="bg-brand-600 text-white rounded-lg p-2">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              Terveyshintavertailu
            </h1>
            <p className="text-sm text-slate-500">Yksityiset terveyspalvelut – Tampere</p>
          </div>
          {overrideCount > 0 && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
              {overrideCount} muokattu hintaa
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <LastUpdatedBanner date={pricesData.lastUpdated} />

        <SummaryStats
          services={pricesData.services}
          providers={pricesData.providers}
          overrides={overrides}
        />

        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          insurancePct={insurancePct}
          onInsurancePctChange={setInsurancePct}
          showInsurance={showInsurance}
          onShowInsuranceChange={setShowInsurance}
          adminMode={adminMode}
          onAdminModeChange={setAdminMode}
          onExportJson={handleExportJson}
        />

        {isMobile ? (
          <MobileCardView
            services={filteredServices}
            providers={pricesData.providers}
            insurancePct={showInsurance ? insurancePct : 0}
            adminMode={adminMode}
            onEditPrice={handleEditPrice}
            overrides={overrides}
          />
        ) : (
          <div className="overflow-x-auto">
            <PriceTable
              services={filteredServices}
              providers={pricesData.providers}
              insurancePct={showInsurance ? insurancePct : 0}
              adminMode={adminMode}
              onEditPrice={handleEditPrice}
              overrides={overrides}
            />
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-slate-400">
        Hinnat ovat suuntaa-antavia arvioita. Tarkista aina ajantasaiset hinnat suoraan palveluntarjoajalta.
        Sivusto ei ole virallisesti yhteydessä mihinkään listattuun yritykseen.
      </footer>

      {editTarget && (
        <AdminEditModal
          service={editTarget.service}
          provider={editTarget.provider}
          current={editTarget.current}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
