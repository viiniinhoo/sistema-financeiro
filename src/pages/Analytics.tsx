import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { TrendingUp, PieChart as PieIcon, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useState } from 'react'

export default function Analytics() {
  const { transactions, categories, loading } = useFinanceData()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

  const analyticsData = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)

    const filteredTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
    )

    // 1. Monthly Summary (Last 6 months)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(selectedDate, 5 - i)
      const s = startOfMonth(d)
      const e = endOfMonth(d)
      
      const monthTrans = transactions.filter(t => isWithinInterval(new Date(t.date + 'T12:00:00'), { start: s, end: e }))
      const income = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
      const expense = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
      
      return { name: format(d, 'MMM', { locale: ptBR }), income, expense }
    })

    // 2. Category Distribution (Current month expenses)
    const catDist = categories
      .filter(c => (c.type || 'expense') === 'expense')
      .map(cat => {
        const value = filteredTransactions
          .filter(t => (t.category_id === cat.id || t.category === cat.name) && t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        return { name: cat.name, value }
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)

    // 3. Daily Trend (For the selected month)
    const days = eachDayOfInterval({ start, end })
    const dailyTrend = days.map(d => {
      const amount = filteredTransactions
        .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd') && t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { day: format(d, 'd'), amount }
    })

    return { last6Months, catDist, dailyTrend }
  }, [transactions, categories, selectedDate])

  if (loading) return <div className="p-8 text-center text-slate-400">Gerando relatórios...</div>

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b']

  return (
    <div className="px-6 py-8 pb-32">
      <header className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Gráficos</h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Análise de Desempenho</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
             <BarChart3 size={20} />
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-2xl shadow-sm">
           <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <ChevronLeft size={20} />
           </button>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Análise de</p>
              <p className="text-sm font-black text-slate-800 capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </p>
           </div>
           <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <ChevronRight size={20} />
           </button>
        </div>
      </header>

      {/* Monthly Summary Chart */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-6">
           <BarChart3 className="text-indigo-600" size={18} />
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Fluxo Mensal</h3>
        </div>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.last6Months}>
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
                    data={analyticsData.catDist}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {analyticsData.catDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="flex flex-col gap-2 shrink-0 max-w-[120px]">
                {analyticsData.catDist.map((entry, index) => (
                   <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{entry.name}</span>
                   </div>
                ))}
                {analyticsData.catDist.length === 0 && (
                  <p className="text-[10px] text-slate-300 font-bold uppercase italic">Sem dados</p>
                )}
             </div>
          </div>
        </div>

        {/* Daily Spending Trend */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
             <TrendingUp className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Tendência Diária</h3>
           </div>
           <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyTrend}>
                  <defs>
                    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradientArea)" />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                </AreaChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
