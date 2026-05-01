import { ArrowUpRight, ArrowDownLeft, Wallet, ChevronRight, ChevronLeft, X, Calendar, Eye, EyeOff } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../contexts/UIContext'

export default function Dashboard() {
  const { transactions, categories } = useFinanceData()
  const { showValues, toggleShowValues } = useUI()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  const stats = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)

    const monthlyTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
    )

    // Monthly Calcs
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
      currentMonthLabel: format(selectedDate, "MMMM yyyy", { locale: ptBR })
    }
  }, [transactions, selectedDate])

  const categoriesWithSpending = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)

    const relevantCategories = categories.map(cat => {
      const spent = transactions
        .filter(t => {
          const isInCategory = t.category_id === cat.id || t.category === cat.name
          const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
          return isInCategory && isInMonth
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { ...cat, spent }
    })

    return relevantCategories.filter(cat => cat.type === 'expense' && cat.spent > 0)
  }, [categories, transactions, selectedDate])

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

  return (
    <div className="px-6 py-8 pb-32 md:pb-12 max-w-5xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">Dashboard</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Minha Carteira</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleShowValues}
             className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-full shadow-sm transition-all active:scale-90"
             title={showValues ? "Ocultar valores" : "Mostrar valores"}
           >
             {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
           </button>

           <div className="flex items-center bg-white border border-slate-100 p-1 rounded-full shadow-sm">
              <button onClick={handlePrevMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-slate-800 px-2 min-w-[80px] text-center capitalize">
                {stats.currentMonthLabel}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </header>



      <div className="relative group mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-7 text-white shadow-xl">
          <div className="flex justify-between items-start mb-6">
             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Wallet size={24} />
             </div>
              <div className="text-right">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/60">{stats.currentMonthLabel}</span>
                 <h2 className="text-3xl font-black mt-1">
                   {showValues 
                     ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance) 
                     : 'R$ ••••••'}
                 </h2>
              </div>
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t border-white/10 mt-6 md:mt-10">
             <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Receitas</p>
                <p className="text-sm font-black text-white">
                  {showValues 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income) 
                    : 'R$ •••'}
                </p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Despesas</p>
                <p className="text-sm font-black text-rose-300">
                  {showValues 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.expense) 
                    : 'R$ •••'}
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Vencimentos Próximos</h3>
          <Link to="/contas-fixas" className="text-xs font-semibold text-indigo-600">Ver Calendário</Link>
        </div>
        <Link to="/contas-fixas" className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-amber-100 transition-all cursor-pointer block">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl">⚡</div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">Vencimentos (Calendário)</h4>
            <p className="text-xs text-amber-700/80">Confira suas contas fixas para este mês</p>
          </div>
          <ChevronRight size={18} className="text-amber-300" />
        </Link>
      </div>

      <section>
        <div className="flex justify-between items-end mb-4 px-1">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Orçamento</h3>
           <button 
             onClick={() => setSelectedCategory({ name: 'Todos os Gastos', icon: '💸', isAll: true })}
             className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
           >
             Ver tudo
           </button>
        </div>
        <div className="space-y-4">
          {categoriesWithSpending.map(cat => (
             <div 
               key={cat.id} 
               onClick={() => setSelectedCategory(cat)}
               className="cursor-pointer active:scale-[0.98] transition-transform bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
             >
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                   </div>
                   <span className="text-xs font-black text-slate-900">
                      {showValues 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.spent)
                        : '••••'
                      }
                      <span className="text-slate-300 font-medium ml-1"> / {showValues 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.budget_limit)
                        : '••••'
                      }</span>
                   </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                      className={`h-full transition-all duration-1000 ${cat.spent > cat.budget_limit ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(100, (cat.spent / cat.budget_limit) * 100)}%` }}
                   />
                </div>
             </div>
          ))}
          {categoriesWithSpending.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhuma atividade orçamentária para este mês</p>}
        </div>
      </section>

      {selectedCategory && (
        <CategoryDetailsModal 
          category={selectedCategory}
          transactions={transactions}
          date={selectedDate}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  )
}

function CategoryDetailsModal({ category, transactions, date, onClose }: any) {
  const { showValues } = useUI()
  const start = startOfMonth(date)
  const end = endOfMonth(date)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      const isInCategory = category.isAll ? t.type === 'expense' : (t.category_id === category.id || t.category === category.name)
      const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
      return isInCategory && isInMonth
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, category, start, end])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"><X size={20}/></button>
        
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{category.name}</h2>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar size={14} className="opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {format(date, "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
            Total este mês: {showValues 
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(category.spent || 0)
              : 'R$ •••••'
            }
          </p>
        </header>

        <div className="max-h-[50vh] overflow-y-auto pr-2 no-scrollbar space-y-3">
          {filteredTransactions.map((t: any) => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                   {t.type === 'income' ? <ArrowUpRight size={18} className="text-emerald-500" /> : <ArrowDownLeft size={18} className="text-rose-500" />}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-sm font-bold text-slate-800 truncate">
                     {t.description.replace(/^PAGAMENTO:\s*/, '')}
                   </p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                     {format(new Date(t.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                   </p>
                </div>
              </div>
              <p className={`text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {t.type === 'expense' ? '- ' : '+ '}
                {showValues 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)
                  : 'R$ •••••'
                }
              </p>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium italic">Nenhuma transação encontrada neste mês.</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 mt-8 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wider"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
