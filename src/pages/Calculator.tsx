import { TrendingUp, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Calculator() {
  const [initial, setInitial] = useState(1000)
  const [monthly, setMonthly] = useState(200)
  const [rate, setRate] = useState(1)
  const [months, setMonths] = useState(24)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const final = initial * Math.pow(1 + rate / 100, months) + monthly * ((Math.pow(1 + rate / 100, months) - 1) / (rate / 100))
    const invested = initial + (monthly * months)
    const interest = final - invested
    setResult({ final, invested, interest })
  }, [initial, monthly, rate, months])

  if (!result) return null

  return (
    <div className="px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Simulador</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Estimativa de Juros Compostos</p>
      </header>

      {/* Main Result Display */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8 group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
           <TrendingUp size={120} />
        </div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Valor Futuro Estimado</p>
        <h2 className="text-4xl font-black tracking-tight mb-8">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.final)}
        </h2>
        
        <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Aportado</p>
            <p className="text-lg font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.invested)}</p>
          </div>
          <div>
            <p className="text-indigo-400 text-[10px] font-bold uppercase mb-1">Juros Ganhos</p>
            <p className="text-lg font-bold text-indigo-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.interest)}</p>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="space-y-4">
           <CalcInput label="Inicial" value={initial} onChange={setInitial} suffix="R$" />
           <CalcInput label="Juros" value={rate} onChange={setRate} suffix="%" />
        </div>
        <div className="space-y-4">
           <CalcInput label="Mensal" value={monthly} onChange={setMonthly} suffix="R$" />
           <CalcInput label="Tempo" value={months} onChange={setMonths} suffix="m" />
        </div>
      </div>

      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex gap-3">
        <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-900/60 leading-relaxed font-medium">Os resultados apresentados são apenas simulações e não garantem rentabilidade futura.</p>
      </div>
    </div>
  )
}

function CalcInput({ label, value, onChange, suffix }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:border-indigo-200 transition-colors">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={value} 
          onChange={e => onChange(Number(e.target.value))} 
          className="w-full text-lg font-bold outline-none text-slate-800 bg-transparent"
        />
        <span className="text-slate-300 font-bold text-xs">{suffix}</span>
      </div>
    </div>
  )
}
