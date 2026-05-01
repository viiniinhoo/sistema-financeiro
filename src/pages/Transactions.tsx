import { ArrowUpRight, ArrowDownLeft, ChevronRight, ChevronLeft, Search, Calendar, Trash2, Plus } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useMemo } from 'react'
import { AddTransaction } from '../components/AddTransaction'

export function Transactions() {
  const { transactions, categories, deleteTransaction } = useFinanceData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState(new Date())

  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)

    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || t.type === filterType
      const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
      return matchesSearch && matchesFilter && isInMonth
    })
  }, [transactions, searchTerm, filterType, selectedDate])

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups: any, transaction) => {
    // transaction.date já é YYYY-MM-DD do Supabase
    const dateKey = transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(transaction)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-6 py-8 pb-32 md:pb-12 max-w-4xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">Extrato</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Movimentações</p>
        </div>
        
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-3 mb-8">
         <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-300 transition-colors">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full text-xs font-bold uppercase tracking-tight" 
            />
         </div>
         <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <FilterBtn active={filterType === 'all'} onClick={() => setFilterType('all')} icon={<Calendar size={14} />} />
            <FilterBtn active={filterType === 'expense'} onClick={() => setFilterType('expense')} icon={<ArrowDownLeft size={14} className="text-rose-500" />} />
            <FilterBtn active={filterType === 'income'} onClick={() => setFilterType('income')} icon={<ArrowUpRight size={14} className="text-emerald-500" />} />
         </div>
      </div>

      <div className="space-y-8">
        {sortedDates.map(dateKey => (
           <div key={dateKey}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <span className="w-1 h-1 rounded-full bg-indigo-600"></span>
                 {format(new Date(dateKey + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="space-y-3">
                 {groupedTransactions[dateKey].map((t: any) => (
                    <TransactionRow 
                      key={t.id} 
                      transaction={t}
                      categories={categories}
                      onDelete={async () => {
                        if (window.confirm('⚠️ Excluir este lançamento permanentemente?')) {
                          await deleteTransaction(t.id)
                        }
                      }}
                    />
                 ))}
              </div>
           </div>
        ))}

        {sortedDates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Nenhum lançamento encontrado.</p>
          </div>
        )}
      </div>

      {/* Local Add Transaction Button */}
      <div className="fixed bottom-28 md:bottom-10 right-6 z-40">
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 text-white p-4 md:px-6 md:py-4 rounded-2xl md:rounded-full shadow-2xl shadow-indigo-600/40 hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-3 group"
        >
          <Plus size={24} />
          <span className="hidden md:block font-bold">Novo Lançamento</span>
        </button>
      </div>

      {isAddOpen && <AddTransaction onClose={() => setIsAddOpen(false)} />}
    </div>
  )
}

function FilterBtn({ active, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400'}`}
      >
         {icon}
      </button>
   )
}

function TransactionRow({ transaction, categories, onDelete }: { transaction: any, categories: any[], onDelete: () => void }) {
  const isIncome = transaction.type === 'income'
  const category = categories?.find(c => c.id === transaction.category_id || c.name === transaction.category)
  const categoryIcon = category?.icon || '📁'
  const categoryName = category?.name || transaction.category || 'Geral'

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:shadow-premium transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
           {categoryIcon}
        </div>
        <div>
           <p className="text-sm font-bold text-slate-800">{transaction.description}</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{categoryName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
           <p className={`text-sm font-black ${isIncome ? 'text-emerald-500' : 'text-slate-900'}`}>
              {isIncome ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
           </p>
           <p className="text-[9px] font-bold text-slate-300 uppercase">{format(new Date(transaction.date + 'T12:00:00'), 'HH:mm')}</p>
        </div>
        <button 
          onClick={onDelete}
          className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
