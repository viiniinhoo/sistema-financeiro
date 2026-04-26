import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { TrendingUp, PieChart as PieIcon, BarChart3, Calendar } from 'lucide-react'

export default function Analytics() {
  const { transactions, categories, loading } = useFinanceData()

  if (loading) return <div className="p-8 text-center text-slate-400">Gerando relatórios...</div>

  // Mock data derivation logic (in a real app, this would be computed from 'transactions')
  // For the MVP, we'll demonstrate the visuals with some derived stats
  
  const monthlyData = [
    { name: 'Jan', income: 12000, expense: 8000 },
    { name: 'Fev', income: 15400, expense: 9200 },
    { name: 'Mar', income: 14000, expense: 11000 },
    { name: 'Abr', income: 15000, expense: 8240 },
  ]

  const categoryDistribution = [
    { name: 'Alimentação', value: 1200 },
    { name: 'Moradia', value: 2500 },
    { name: 'Lazer', value: 800 },
    { name: 'Saúde', value: 300 },
  ]

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316']

  return (
    <div className="px-6 py-8 pb-32">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Gráficos</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Análise de Desempenho</p>
      </header>

      {/* Monthly Summary Chart */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-6">
           <BarChart3 className="text-indigo-600" size={18} />
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Fluxo Mensal</h3>
        </div>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
             <PieIcon className="text-indigo-600" size={18} />
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Gastos por Categoria</h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex flex-col gap-2 shrink-0">
                {categoryDistribution.map((entry, index) => (
                   <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Daily Spending Trend */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
             <TrendingUp className="text-indigo-600" size={18} />
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Tendência Semanal</h3>
          </div>
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 { day: 'S', amount: 120 },
                 { day: 'T', amount: 450 },
                 { day: 'Q', amount: 300 },
                 { day: 'Q', amount: 800 },
                 { day: 'S', amount: 200 },
                 { day: 'S', amount: 600 },
                 { day: 'D', amount: 150 },
               ]}>
                 <defs>
                   <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradientArea)" />
                 <Tooltip />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
