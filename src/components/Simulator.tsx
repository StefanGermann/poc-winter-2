import { useState, useMemo } from 'react'

// Lookup table: demand -> avg_old (VLOOKUP approximate match)
const LOOKUP_TABLE: [number, number][] = [
  [0, 0], [0.01, 0.025], [0.02, 0.03333333333333333], [0.03, 0.05],
  [0.04, 0.06], [0.05, 0.075], [0.06, 0.08571428571428573], [0.07, 0.1],
  [0.08, 0.1111111111111111], [0.09, 0.125], [0.1, 0.13636363636363635],
  [0.11, 0.15], [0.12, 0.16153846153846155], [0.13, 0.175], [0.14, 0.18666666666666668],
  [0.15, 0.2], [0.16, 0.21176470588235294], [0.17, 0.225], [0.18, 0.23684210526315788],
  [0.19, 0.25], [0.2, 0.2619047619047619], [0.21, 0.2727272727272727],
  [0.22, 0.2826086956521739], [0.23, 0.2916666666666667], [0.24, 0.3],
  [0.25, 0.3076923076923077], [0.26, 0.3148148148148148], [0.27, 0.32142857142857145],
  [0.28, 0.3275862068965517], [0.29, 0.3333333333333333], [0.3, 0.3387096774193548],
  [0.31, 0.3453125], [0.32, 0.35151515151515156], [0.33, 0.35735294117647065],
  [0.34, 0.36285714285714293], [0.35, 0.36805555555555564], [0.36, 0.3729729729729731],
  [0.37, 0.37763157894736854], [0.38, 0.3820512820512822], [0.39, 0.38625000000000015],
  [0.4, 0.39024390243902457], [0.41, 0.39404761904761926], [0.42, 0.39767441860465136],
  [0.43, 0.4022727272727275], [0.44, 0.4066666666666669], [0.45, 0.4108695652173916],
  [0.46, 0.4148936170212769], [0.47, 0.41875000000000034], [0.48, 0.4224489795918371],
  [0.49, 0.4260000000000004], [0.5, 0.42941176470588277], [0.51, 0.4326923076923081],
  [0.52, 0.435849056603774], [0.53, 0.43888888888888933], [0.54, 0.4418181818181823],
  [0.55, 0.4455357142857147], [0.56, 0.44912280701754426], [0.57, 0.4525862068965521],
  [0.58, 0.45593220338983087], [0.59, 0.459166666666667], [0.6, 0.4622950819672134],
  [0.61, 0.4653225806451615], [0.62, 0.4682539682539685], [0.63, 0.4710937500000002],
  [0.64, 0.47384615384615403], [0.65, 0.47651515151515167], [0.66, 0.4791044776119404],
  [0.67, 0.48235294117647076], [0.68, 0.4855072463768118], [0.69, 0.4885714285714288],
  [0.7, 0.4915492957746482], [0.71, 0.49444444444444474], [0.72, 0.4972602739726031],
  [0.73, 0.5000000000000003], [0.74, 0.502666666666667], [0.75, 0.5052631578947373],
  [0.76, 0.5077922077922082], [0.77, 0.5102564102564108], [0.78, 0.5126582278481018],
  [0.79, 0.5156250000000006], [0.8, 0.518518518518519], [0.81, 0.5213414634146347],
  [0.82, 0.5240963855421692], [0.83, 0.5267857142857147], [0.84, 0.5294117647058828],
  [0.85, 0.531976744186047], [0.86, 0.5344827586206902], [0.87, 0.5369318181818187],
  [0.88, 0.5393258426966296], [0.89, 0.5416666666666672], [0.9, 0.5439560439560445],
  [0.91, 0.5467391304347831], [0.92, 0.5494623655913983], [0.93, 0.5526595744680856],
  [0.94, 0.5557894736842109], [0.95, 0.5593750000000004], [0.96, 0.5628865979381447],
  [0.97, 0.566836734693878], [0.98, 0.5707070707070712], [0.99, 0.5750000000000004],
  [1, 0.5792079207920796],
]

function vlookup(demand: number): number {
  // Approximate match: find largest demand <= lookup value
  let result = LOOKUP_TABLE[0][1]
  for (const [d, avgOld] of LOOKUP_TABLE) {
    if (d <= demand) result = avgOld
    else break
  }
  return result
}

type Adoption = 'weak' | 'medium' | 'strong' | 'very strong'

const ADOPTION_BASE: Record<Adoption, number> = {
  weak: 0,
  medium: 0.05,
  strong: 0.1,
  'very strong': 0.15,
}

const PRODUCTS = [
  'ski_half_day', 'ski_1d', 'ski_2d', 'ski_3d', 'ski_4d',
  'ski_5d', 'ski_6d', 'ski_7d', 'ski_8d', 'ski_9d',
  'ski_10d', 'ski_11d', 'ski_12d', 'ski_13d', 'ski_14d',
]

const DEFAULT_SHARES = [0.113, 0.422, 0.1, 0.069, 0.047, 0.059, 0.117, 0.046, 0.013, 0.004, 0, 0, 0, 0, 0.01]

function getEarlyBookers(adoption: Adoption): number[] {
  const base = ADOPTION_BASE[adoption]
  // D8=D9=base, D10-12=MIN(1,base*2+0.25), D13-17=MIN(1,prev*1.5), D18-22=MIN(1,prev*1.5)
  const d1 = base
  const d2 = Math.min(1, d1 * 2 + 0.25)
  const d3 = Math.min(1, d2 * 1.5)
  const d4 = Math.min(1, d3 * 1.5)
  return [d1, d1, d2, d2, d2, d3, d3, d3, d3, d3, d4, d4, d4, d4, d4]
}

function fmt(v: number, digits = 4): string {
  return (v * 100).toFixed(digits) + '%'
}

function fmtRaw(v: number, digits = 5): string {
  return v.toFixed(digits)
}

export default function Simulator() {
  const [maxEBDPct, setMaxEBDPct] = useState(25) // 0-100, positive; actual = -maxEBDPct/100
  const [adoption, setAdoption] = useState<Adoption>('weak')
  const [shares, setShares] = useState<number[]>(DEFAULT_SHARES.map(s => Math.round(s * 1000) / 10))
  // shares stored as percentages (0-100), e.g. 11.3 means 11.3%

  const maxEBD = -(maxEBDPct / 100)

  const earlyBookers = useMemo(() => getEarlyBookers(adoption), [adoption])

  const normalizedShares = useMemo(() => {
    const total = shares.reduce((a, b) => a + b, 0)
    return total === 0 ? shares.map(() => 0) : shares.map(s => s / total)
  }, [shares])

  const sharesTotal = useMemo(() => shares.reduce((a, b) => a + b, 0), [shares])

  // Portfolio-level early booker rate (SUMPRODUCT of normalized shares * earlyBookers)
  const portfolioEB = useMemo(
    () => normalizedShares.reduce((sum, s, i) => sum + s * earlyBookers[i], 0),
    [normalizedShares, earlyBookers]
  )

  const rows = useMemo(() => {
    const avgOldPortfolio = vlookup(portfolioEB)
    return PRODUCTS.map((name, i) => {
      const eb = earlyBookers[i]
      const lb = 1 - eb
      const share = normalizedShares[i]
      const avgOldProduct = vlookup(eb)
      const w1 = maxEBD * ((1 - avgOldProduct) * eb + 0.2 * lb)
      const w2old = maxEBD * ((1 - avgOldPortfolio) * eb + 0.2 * lb)
      const effect = w2old - w1
      const totalEffect = effect * share
      return { name, share, eb, lb, w1, w2old, effect, totalEffect }
    })
  }, [maxEBD, earlyBookers, normalizedShares, portfolioEB])

  const totalEffect = useMemo(() => rows.reduce((s, r) => s + r.totalEffect, 0), [rows])

  function handleShareChange(i: number, val: number) {
    const next = [...shares]
    next[i] = Math.max(0, Math.min(100, val))
    setShares(next)
  }

  function normalize() {
    const total = shares.reduce((a, b) => a + b, 0)
    if (total === 0) return
    setShares(shares.map(s => Math.round((s / total * 100) * 10) / 10))
  }

  const isExact = Math.abs(sharesTotal - 100) < 0.05

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">POC Simulations-Tool</h1>
          <p className="text-slate-500 mt-1">Adelboden 2026/27 – Produktkurven-Modell</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* max_EBD Slider */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
              max_EBD
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={maxEBDPct}
                onChange={e => setMaxEBDPct(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-2xl font-bold text-blue-700 w-16 text-right tabular-nums">
                {maxEBDPct}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Aktueller Wert (A3): {maxEBD.toFixed(4)}</p>
          </div>

          {/* Adoption */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Adoption
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['weak', 'medium', 'strong', 'very strong'] as Adoption[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setAdoption(opt)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    adoption === opt
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Basis-EB-Rate: {(ADOPTION_BASE[adoption] * 100).toFixed(0)}%
            </p>
          </div>

          {/* Total Effect Result */}
          <div className={`rounded-2xl shadow-sm border p-6 flex flex-col justify-between ${
            totalEffect < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div>
              <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Total_Effect (J6)
              </label>
              <p className="text-xs text-slate-500">Gesamtportfolio-Effekt</p>
            </div>
            <div className={`text-4xl font-bold tabular-nums mt-4 ${
              totalEffect < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {(totalEffect * 100).toFixed(4)}%
            </div>
            <div className="text-sm text-slate-500 mt-2">
              Portfolio EB-Rate: {(portfolioEB * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Shares + Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Produkt-Anteile &amp; Effekte</h2>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                isExact ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Summe: {sharesTotal.toFixed(1)}%
                {!isExact && ' ≠ 100%'}
              </span>
              {!isExact && (
                <button
                  onClick={normalize}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Normalisieren
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Produkt</th>
                  <th className="text-left px-4 py-3 font-semibold">Share (%)</th>
                  <th className="text-right px-4 py-3 font-semibold">Eff. Share</th>
                  <th className="text-right px-4 py-3 font-semibold">Early Bookers</th>
                  <th className="text-right px-4 py-3 font-semibold bg-blue-50">w1</th>
                  <th className="text-right px-4 py-3 font-semibold bg-purple-50">w2_old</th>
                  <th className="text-right px-4 py-3 font-semibold">Effekt</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Effekt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.name} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          value={shares[i]}
                          onChange={e => handleShareChange(i, Number(e.target.value))}
                          className="w-24 accent-blue-500"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={shares[i]}
                          onChange={e => handleShareChange(i, Number(e.target.value))}
                          className="w-16 text-right border border-slate-200 rounded px-1 py-0.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {(row.share * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {(row.eb * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums bg-blue-50/50 font-mono">
                      <span className={row.w1 < 0 ? 'text-red-600' : 'text-green-600'}>
                        {fmtRaw(row.w1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums bg-purple-50/50 font-mono">
                      <span className={row.w2old < 0 ? 'text-red-600' : 'text-green-600'}>
                        {fmtRaw(row.w2old)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      <span className={row.effect < 0 ? 'text-red-500' : row.effect > 0 ? 'text-green-500' : 'text-slate-400'}>
                        {fmtRaw(row.effect)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      <span className={row.totalEffect < 0 ? 'text-red-500' : row.totalEffect > 0 ? 'text-green-500' : 'text-slate-400'}>
                        {fmtRaw(row.totalEffect)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                  <td className="px-4 py-3 text-slate-700">Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(normalizedShares.reduce((s, v) => s + v, 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {(portfolioEB * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right bg-blue-100/70 font-mono">
                    {fmtRaw(rows.reduce((s, r) => s + r.w1 * r.share, 0))}
                  </td>
                  <td className="px-4 py-3 text-right bg-purple-100/70 font-mono">
                    {fmtRaw(rows.reduce((s, r) => s + r.w2old * r.share, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmtRaw(rows.reduce((s, r) => s + r.effect * r.share, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-base ${
                    totalEffect < 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {fmtRaw(totalEffect)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
          <div className="bg-white rounded-xl border p-3">
            <span className="font-semibold text-blue-700">w1:</span> Produktspezifischer EBD-Gewicht (individuelle EB-Rate)
          </div>
          <div className="bg-white rounded-xl border p-3">
            <span className="font-semibold text-purple-700">w2_old:</span> Portfolio-EBD-Gewicht (Portfolio EB-Rate)
          </div>
          <div className="bg-white rounded-xl border p-3">
            <span className="font-semibold text-slate-700">Effekt:</span> w2_old − w1 (Differenz bei Verwendung der Portfolio-Rate)
          </div>
          <div className="bg-white rounded-xl border p-3">
            <span className="font-semibold text-slate-700">Total Effekt (J6):</span> Effekt × Share, summiert über alle Produkte
          </div>
        </div>
      </div>
    </div>
  )
}
