import { Search, ArrowUpDown, Shield, Lock, Unlock, Download } from 'lucide-react'

export default function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  insurancePct,
  onInsurancePctChange,
  showInsurance,
  onShowInsuranceChange,
  adminMode,
  onAdminModeChange,
  onExportJson,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Hae palvelua..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-500 hover:text-brand-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort + toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="name">Järjestys: Nimi</option>
              <option value="cheapest">Halvin ensin</option>
              <option value="expensive">Kallein ensin</option>
            </select>
          </div>

          {/* Insurance toggle */}
          <button
            onClick={() => onShowInsuranceChange(!showInsurance)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
              showInsurance
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <Shield size={13} />
            Omavastuu
          </button>

          {/* Admin toggle */}
          <button
            onClick={() => onAdminModeChange(!adminMode)}
            title={adminMode ? 'Sulje admin-tila' : 'Avaa admin-tila (muokkaa hintoja)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
              adminMode
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-400 border-slate-200 hover:border-amber-400 hover:text-amber-500'
            }`}
          >
            {adminMode ? <Unlock size={13} /> : <Lock size={13} />}
            {adminMode ? 'Admin päällä' : 'Admin'}
          </button>

          {adminMode && (
            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Download size={13} />
              Vie JSON
            </button>
          )}
        </div>
      </div>

      {/* Insurance panel */}
      {showInsurance && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Shield size={15} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">Vakuutus / työnantajaetu</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={insurancePct}
              onChange={e => onInsurancePctChange(Number(e.target.value))}
              className="w-36 accent-indigo-600"
            />
            <span className="text-sm font-semibold text-indigo-700 w-12">{insurancePct} %</span>
            <span className="text-xs text-indigo-600">
              Hinnoissa näytetään {100 - insurancePct} % omavastuuosuus
            </span>
          </div>
          <p className="text-xs text-indigo-500 sm:ml-auto">
            Kela ei korvaa yksityiskäyntejä v. 2024 alkaen.
          </p>
        </div>
      )}

      {adminMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800">
          Admin-tila: klikkaa <strong>Muokkaa</strong> minkä tahansa hinnan kohdalla. Muutokset tallennetaan selaimeen.
        </div>
      )}
    </div>
  )
}
