import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { TrendingUp, PieChart as PieIcon, BarChart3, ChevronLeft, ChevronRight, Target, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useState } from 'react'

export default function Analytics() {
  const { transactions, categories, loading } = useFinanceData()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [donutType, setDonutType] = useState<'expense' | 'investment'>('expense')

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

  const analyticsData = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    
    // Month over Month Calculation
    const prevMonthStart = startOfMonth(subMonths(selectedDate, 1))
    const prevMonthEnd = endOfMonth(subMonths(selectedDate, 1))

    const currentTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
    )
    
    const prevTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date + 'T12:00:00'), { start: prevMonthStart, end: prevMonthEnd })
    )

    const income = currentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
    const expense = currentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
    const investment = currentTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
    
    // Saving Rate: Computed using (Income - Expense) as the raw saving potential
    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0
    
    // Investment Rate: Actual amount sent to investments vs total income
    const investmentRate = income > 0 ? (investment / income) * 100 : 0
    
    const balance = income - expense - investment
    
    // Expense Variation (MoM)
    const expenseVariation = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0

    // 1. Monthly Summary (Last 6 months)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(selectedDate, 5 - i)
      const s = startOfMonth(d)
      const e = endOfMonth(d)
      const monthTrans = transactions.filter(t => isWithinInterval(new Date(t.date + 'T12:00:00'), { start: s, end: e }))
      const inc = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
      const exp = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
      const inv = monthTrans.filter(t => t.type === 'investment').reduce((sum, t) => sum + (t.amount || 0), 0)
      return { 
        name: format(d, 'MMM', { locale: ptBR }), 
        income: inc, 
        expense: exp,
        investment: inv
      }
    })

    // 2. Category Distribution
    const catDist = categories
      .filter(c => (c.type || 'expense') === donutType)
      .map(cat => {
        const value = currentTransactions
          .filter(t => (t.category_id === cat.id || t.category === cat.name) && t.type === donutType)
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        return { name: cat.name, value, icon: cat.icon }
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)

    // 3. Daily Trend
    const last15Days = Array.from({ length: 15 }).map((_, i) => {
      const d = subDays(new Date(), 14 - i)
      const amount = transactions
        .filter(t => t.date === format(d, 'yyyy-MM-dd') && t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { day: format(d, 'dd/MM'), amount }
    })

    // Advanced Insight Selection
    const getInsight = () => {
      // 1. Emergency / Warning (Prioridade Máxima)
      if (income === 0 && (expense > 0 || investment > 0)) {
        return { 
          text: "Modo de Sobrevivência: Você não registrou entradas, mas houve saídas. Revise suas reservas urgentes.", 
          color: "from-rose-600 to-rose-700", 
          icon: AlertTriangle 
        }
      }
      if (balance < 0) {
        return { 
          text: "Atenção: Suas saídas superaram seu faturamento. Este mês você está consumindo seu patrimônio, não construindo.", 
          color: "from-orange-600 to-rose-600", 
          icon: AlertTriangle 
        }
      }
      if (expenseVariation > 25) {
        return { 
          text: `Seus gastos subiram ${expenseVariation.toFixed(0)}% este mês. Identifique se houve inflação de estilo de vida ou imprevistos.`, 
          color: "from-amber-500 to-orange-600", 
          icon: Zap 
        }
      }

      // 2. Investment Focus
      if (investmentRate > 25) {
        return { 
          text: "Nível Investidor Master! Com essa taxa de aporte, sua independência financeira chegará muito antes do previsto.", 
          color: "from-indigo-600 to-violet-800", 
          icon: Target 
        }
      }
      if (savingRate > 30 && investmentRate < 5) {
        return { 
          text: "Poupador Inativo: Você tem uma margem linda para investir, mas o dinheiro está parado. Mova essa sobra para o futuro!", 
          color: "from-indigo-500 to-blue-600", 
          icon: Zap 
        }
      }
      if (investment > 0 && investmentRate > 15) {
        return { 
          text: "Parabéns pelos aportes! Manter essa consistência é o que diferencia os vencedores no longo prazo.", 
          color: "from-emerald-600 to-teal-700", 
          icon: CheckCircle2 
        }
      }

      // 3. Positive / General
      if (expenseVariation < -15 && expense > 0) {
        return { 
          text: "Disciplina de Ouro! Você reduziu seus gastos significativamente este mês. Continue assim!", 
          color: "from-emerald-500 to-emerald-700", 
          icon: CheckCircle2 
        }
      }
      if (savingRate > 15) {
        return { 
          text: "Boa saúde financeira! Você conseguiu guardar uma fatia saudável do que ganhou este mês.", 
          color: "from-indigo-600 to-indigo-800", 
          icon: TrendingUp 
        }
      }

      return { 
        text: "Mês em andamento. Continue registrando seus lançamentos para uma análise mais profunda.", 
        color: "from-slate-700 to-slate-900", 
        icon: TrendingUp 
      }
    }

    const insight = getInsight()

    return { 
      income, 
      expense, 
      investment,
      balance, 
      savingRate, 
      investmentRate,
      expenseVariation,
      last6Months, 
      catDist, 
      last15Days,
      insight
    }
  }, [transactions, categories, selectedDate])

  if (loading) return <div className="p-8 text-center text-slate-400">Analisando dados...</div>

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b']

  return (
    <div className="px-4 py-6 pb-32 md:pb-12 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">Inteligência</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sua saúde financeira</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-100 p-1 rounded-full shadow-sm">
          <button onClick={handlePrevMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-slate-800 px-2 min-w-[80px] text-center capitalize">
            {format(selectedDate, 'MMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="text-indigo-600" size={32} />
          </div>
          <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Capacidade</span>
          <div className="flex items-end gap-1">
             <h4 className="text-xl sm:text-2xl font-black text-indigo-600">{analyticsData.savingRate.toFixed(1)}%</h4>
             <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 mb-1">livre</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-2">O que sobrou dos ganhos</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp className="text-violet-600" size={32} />
          </div>
          <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Taxa de Aporte</span>
          <h4 className="text-xl sm:text-2xl font-black text-violet-600">
             {analyticsData.investmentRate.toFixed(1)}%
          </h4>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-2">Investido este mês</p>
        </div>
      </div>

      {/* Donut Chart - Gastos por Categoria */}
      <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-2">
              <PieIcon className="text-indigo-600" size={18} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Distribuição</h3>
           </div>
           <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setDonutType('expense')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${donutType === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Gastos
              </button>
              <button 
                onClick={() => setDonutType('investment')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${donutType === 'investment' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Investir
              </button>
           </div>
        </div>

        <div className="relative h-56 sm:h-64 w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.catDist}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  cornerRadius={6}
                  dataKey="value"
                  stroke="none"
                >
                  {analyticsData.catDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{donutType === 'investment' ? 'Investido' : 'Total Gasto'}</p>
                <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                  {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(donutType === 'investment' ? analyticsData.investment : analyticsData.expense)}
                </p>
            </div>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-8">
           {analyticsData.catDist.slice(0, 6).map((entry, index) => (
             <div key={entry.name} className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                <div className="min-w-0 flex-1 flex justify-between items-center sm:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate mr-2 sm:mr-0">{entry.name}</p>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(entry.value)}
                  </p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Insight Card */}
      <div className={`bg-gradient-to-br ${analyticsData.insight.color} p-6 sm:p-7 rounded-3xl sm:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden transition-all duration-500`}>
         <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
            <analyticsData.insight.icon size={120} />
         </div>
         <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 block mb-2">Insight do Sistema</span>
            <h3 className="text-lg font-bold leading-tight mb-4 text-white">
               {analyticsData.insight.text}
            </h3>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
               <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
                    <analyticsData.insight.icon size={12} />
                  </div>
               </div>
               <p className="text-[10px] font-medium text-white/70">Inteligência Financeira Ativa</p>
            </div>
         </div>
      </div>

      {/* Monthly Flow Chart */}
      <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <BarChart3 className="text-indigo-600" size={18} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Fluxo de Caixa</h3>
           </div>
           <div className="flex gap-2">
              <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[8px] font-black uppercase text-slate-400">Entrada</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                 <span className="text-[8px] font-black uppercase text-slate-400">Saída</span>
              </div>
           </div>
        </div>
        
        <div className="h-48 w-full mt-4">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.last6Months} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={10} name="Entradas" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={10} name="Saídas" />
                <Bar dataKey="investment" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={10} name="Investimentos" />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Spending Trend 15d */}
      <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
           <TrendingUp className="text-indigo-600" size={18} />
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Gastos Últimos 15 dias</h3>
        </div>
        <div className="h-40 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={analyticsData.last15Days}>
               <defs>
                 <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Tooltip 
                 contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                 labelFormatter={(label) => `Data: ${label}`}
               />
               <XAxis dataKey="day" hide />
               <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradientArea)" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
