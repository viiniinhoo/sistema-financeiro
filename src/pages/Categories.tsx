import { PieChart, ListTree, X, Edit3, Trash2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { useMemo, useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Categories() {
  const { categories, transactions, upsertCategory, deleteCategory } = useFinanceData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense')

  const categoriesWithSpending = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)

    const filtered = categories.filter(c => (c.type || 'expense') === categoryType)

    return filtered.map(cat => {
      const spent = transactions
        .filter(t => {
          const tDate = new Date(t.date + 'T12:00:00')
          const isInCategory = t.category_id === cat.id || t.category === cat.name
          const isInMonth = isWithinInterval(tDate, { start, end })
          return isInCategory && isInMonth
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { ...cat, spent }
    })
  }, [categories, transactions, selectedDate, categoryType])

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

  const handleSave = async (data: any) => {
    const success = await upsertCategory(data)
    if (success) {
      setIsModalOpen(false)
      setEditingCat(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Tem certeza que deseja excluir esta categoria? Esta ação não poderá ser desfeita.')) {
      await deleteCategory(id)
    }
  }

  return (
    <div className="px-6 py-8 pb-32 md:pb-12 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Orçamento</h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Limites e Categorias</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
             <PieChart size={20} />
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-2xl shadow-sm">
           <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <ChevronLeft size={20} />
           </button>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Referência</p>
              <p className="text-sm font-black text-slate-800 capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </p>
           </div>
           <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <ChevronRight size={20} />
           </button>
        </div>
      </header>

      {/* Type Selector Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
        <button 
          onClick={() => setCategoryType('expense')}
          className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${categoryType === 'expense' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400 opacity-60'}`}
        >
          <ArrowDownLeft size={16} className={categoryType === 'expense' ? 'text-rose-500' : ''} />
          <span className="uppercase tracking-tighter">Meus Gastos</span>
        </button>
        <button 
          onClick={() => setCategoryType('income')}
          className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${categoryType === 'income' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400 opacity-60'}`}
        >
          <ArrowUpRight size={16} className={categoryType === 'income' ? 'text-emerald-500' : ''} />
          <span className="uppercase tracking-tighter">Minhas Fontes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithSpending.map(cat => (
          <CategoryCard 
            key={cat.id}
            icon={cat.icon || '📁'} 
            title={cat.name} 
            used={cat.spent || 0} 
            limit={cat.budget_limit || 0} 
            type={cat.type || 'expense'}
            color="bg-indigo-600" 
            items={transactions.filter(t => {
               const isInCategory = t.category_id === cat.id || t.category === cat.name
               const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { 
                 start: startOfMonth(selectedDate), 
                 end: endOfMonth(selectedDate) 
               })
               return isInCategory && isInMonth
             }).length}
            onEdit={() => { setEditingCat(cat); setIsModalOpen(true); }}
            onDelete={() => handleDelete(cat.id)}
          />
        ))}

        {categoriesWithSpending.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
             <ListTree size={32} className="text-slate-200 mx-auto mb-3" />
             <p className="text-xs text-slate-400 font-medium">Nenhuma categoria de {categoryType === 'expense' ? 'gasto' : 'receita'} cadastrada</p>
          </div>
        )}
        
        <button 
          onClick={() => { setEditingCat(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 w-full py-5 bg-slate-50 border border-slate-100 rounded-3xl text-slate-400 font-bold text-sm hover:bg-white hover:border-indigo-200 transition-all"
        >
           + Adicionar {categoryType === 'expense' ? 'Categoria de Gasto' : 'Fonte de Receita'}
        </button>
      </div>

      {isModalOpen && (
        <CategoryModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={editingCat} 
        />
      )}
    </div>
  )
}

function CategoryModal({ onClose, onSave, initialData }: any) {
  const [name, setName] = useState(initialData?.name || '')
  const [limit, setLimit] = useState(initialData?.budget_limit || '')
  const [icon, setIcon] = useState(initialData?.icon || '📁')
  const [type, setType] = useState(initialData?.type || 'expense')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"><X size={20}/></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{initialData ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        
        <div className="space-y-6">
          {/* Type Selection in Modal */}
          <div className="flex p-1 bg-slate-50 rounded-xl mb-4">
            <button 
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${type === 'expense' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
            >
              Gasto
            </button>
            <button 
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${type === 'income' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
            >
              Receita
            </button>
          </div>

          <div className="flex justify-center mb-2">
            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ícone</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="w-16 h-16 text-center text-3xl bg-slate-50 rounded-2xl border-none outline-indigo-500 shadow-inner" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nome da Categoria</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={type === 'expense' ? "Ex: Mercado" : "Ex: Salário Freelance"} className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
          </div>
          {type === 'expense' && (
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Limite Mensal</label>
              <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
            </div>
          )}
        </div>

        <button 
          onClick={() => onSave({ ...initialData, name, budget_limit: type === 'expense' ? parseFloat(limit as string) || 0 : 0, icon, type })}
          className="w-full py-5 mt-10 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-lg"
        >
          {initialData ? 'Salvar Alterações' : 'Criar Agora'}
        </button>
      </div>
    </div>
  )
}

function CategoryCard({ icon, title, used, limit, color, items, onEdit, onDelete, type }: any) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const isOver = limit > 0 && used >= limit
  const isIncome = type === 'income'

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-premium transition-all relative group">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 ${isIncome ? 'bg-emerald-50' : 'bg-slate-50'}`}>
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{title}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{items} lançamentos este mês</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
            <Edit3 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isIncome ? 'text-emerald-500' : isOver ? 'text-rose-500' : 'text-slate-400'}`}>
            {isIncome ? 'Total Recebido' : isOver ? 'Limite atingido' : 'Disponível'}
          </span>
          <p className="text-xs font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(used)} 
            {!isIncome && limit > 0 && (
              <span className="text-slate-300 font-medium"> / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limit)}</span>
            )}
          </p>
        </div>
        {!isIncome && limit > 0 && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`${color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
          </div>
        )}
      </div>
    </div>
  )
}
