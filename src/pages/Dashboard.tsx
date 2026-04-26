import { ArrowUpRight, ArrowDownLeft, Wallet, Bell, ChevronRight } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { transactions, categories } = useFinanceData()

  const stats = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const monthlyTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
    )

    const incomeTotal = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (t.amount || 0), 0)
    
    const expenseTotal = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (t.amount || 0), 0)

    return {
      income: incomeTotal,
      expense: expenseTotal,
      balance: incomeTotal - expenseTotal,
      currentMonthLabel: format(now, "MMMM yyyy", { locale: ptBR })
    }
  }, [transactions])

  const categoriesWithSpending = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    return categories.map(cat => {
      const spent = transactions
        .filter(t => {
          const isInCategory = t.category_id === cat.id || t.category === cat.name
          const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
          return isInCategory && isInMonth
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { ...cat, spent }
    })
  }, [categories, transactions])

  // Removido check de loading para ser instantâneo
  // if (loading) return <div className="p-8 text-center text-slate-400">Carregando painel...</div>

  return (
    <div className="px-6 py-8 pb-32">
      {/* Header section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Bem-vindos de volta</p>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Nossas Finanças</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
           <Bell size={20} className="text-slate-600" />
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="relative group mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-7 text-white shadow-xl">
          <div className="flex justify-between items-start mb-6">
             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Wallet size={24} />
             </div>
              <div className="text-right">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/60">{stats.currentMonthLabel}</span>
              </div>
          </div>
          <p className="text-indigo-100/80 text-sm font-medium mb-1">Saldo Total</p>
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance)}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                <ArrowUpRight size={16} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] text-indigo-100/60 font-bold uppercase">Entradas</p>
                <p className="text-sm font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-400/20 flex items-center justify-center">
                <ArrowDownLeft size={16} className="text-rose-300" />
              </div>
              <div>
                <p className="text-[10px] text-indigo-100/60 font-bold uppercase">Saídas</p>
                <p className="text-sm font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.expense)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Vencimentos Próximos</h3>
          <Link to="/contas-fixas" className="text-xs font-semibold text-indigo-600">Ver Calendário</Link>
        </div>
        {/* Real data for fixed bills could be integrated here */}
        <Link to="/contas-fixas" className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-amber-100 transition-all cursor-pointer block">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl">⚡</div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">Vencimentos (Calendário)</h4>
            <p className="text-xs text-amber-700/80">Confira suas contas fixas para este mês</p>
          </div>
          <ChevronRight size={18} className="text-amber-300" />
        </Link>
      </div>

      {/* Budget Summary */}
      <div>
        <div className="flex justify-between items-end mb-4">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Orçamento</h3>
        </div>
        <div className="space-y-4">
          {categoriesWithSpending.slice(0, 3).map(cat => (
            <BudgetRow 
              key={cat.id}
              label={cat.name} 
              icon={cat.icon || '📁'} 
              used={cat.spent || 0} 
              limit={cat.budget_limit || 0} 
              color="bg-indigo-600" 
            />
          ))}
          {categories.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhuma categoria cadastrada</p>}
        </div>
      </div>
    </div>
  )
}

function BudgetRow({ label, icon, used, limit, color }: any) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  return (
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:shadow-premium transition-all cursor-pointer">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-bold text-slate-800">{label}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">R$ {used} / {limit}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
