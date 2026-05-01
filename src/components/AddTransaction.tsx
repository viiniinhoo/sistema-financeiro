import { X, Calendar, Wallet, Layers, ArrowUpRight, ArrowDownLeft, Trash2, Target } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { createTransactionWithInstallments, updateInstallmentGroup } from '../lib/transactionLogic'
import { useAuth } from '../contexts/AuthContext'
import { useFinanceData } from '../hooks/useFinanceData'
import { useUI } from '../contexts/UIContext'

export function AddTransaction({ onClose, editingTransaction }: { onClose: () => void, editingTransaction?: any }) {
  const { setBottomNavVisible } = useUI()
  const { user, householdId } = useAuth()
  const { refreshData, categories, deleteTransaction } = useFinanceData()
  
  const [type, setType] = useState(editingTransaction?.type || 'expense')
  const [amount, setAmount] = useState<string>(editingTransaction?.amount?.toString() || '')
  const [description, setDescription] = useState(editingTransaction?.description || '')
  const [categoryName, setCategoryName] = useState('Geral')
  const [date, setDate] = useState(editingTransaction?.date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [installments, setInstallments] = useState<number>(editingTransaction?.installment_total || 1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === type)
  }, [categories, type])

  // Sync category name if editing or when type changes
  useEffect(() => {
    if (editingTransaction) {
        const cat = categories.find(c => c.id === editingTransaction.category_id || c.name === editingTransaction.category)
        if (cat) setCategoryName(cat.name)
    } else if (filteredCategories.length > 0) {
      setCategoryName(filteredCategories[0].name)
    } else {
      setCategoryName('Geral')
    }
  }, [type, filteredCategories, editingTransaction, categories])

  useEffect(() => {
    setBottomNavVisible(false)
    return () => setBottomNavVisible(true)
  }, [setBottomNavVisible])

  const handleSubmit = async () => {
    if (!amount || !description) {
      alert("Por favor, preencha o valor e a descrição!")
      return
    }
    if (!householdId) return
    setIsSubmitting(true)

    const selectedCategory = categories.find(c => c.name === categoryName)
    
    try {
      if (editingTransaction) {
        const res = await updateInstallmentGroup(
          editingTransaction.id,
          editingTransaction.installment_group_id,
          householdId,
          {
            description,
            amount: parseFloat(amount),
            date,
            category_id: selectedCategory?.id,
            type: type
          },
          false, 
          editingTransaction.installment_current || 1
        )
        if (res.error) throw res.error
      } else {
        const res = await createTransactionWithInstallments({
          householdId: householdId,
          categoryId: selectedCategory?.id || categories[0]?.id || '',
          description,
          amount: parseFloat(amount),
          date,
          type: type as 'income' | 'expense' | 'investment',
          installmentTotal: installments,
          createdBy: user?.user_metadata?.full_name || user?.email || 'Anonymous'
        })
        if (res.error) throw res.error
      }

      await refreshData()
      onClose()
    } catch (error: any) {
      console.error('Error saving transaction:', error)
      alert('Erro ao salvar: ' + (error.message || 'Verifique sua conexão'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('⚠️ Excluir este lançamento permanentemente?')) {
      setIsSubmitting(true)
      const success = await deleteTransaction(editingTransaction.id)
      if (success) {
        onClose()
      } else {
        alert('Erro ao excluir')
        setIsSubmitting(false)
      }
    }
  }
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-[480px] bg-white rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom duration-500"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-8 top-8 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{editingTransaction ? 'Editar Registro' : 'Novo Registro'}</h2>

        {/* Type Selector Tabs */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
          <Tab active={type === 'expense'} onClick={() => setType('expense')} icon={<ArrowDownLeft size={16}/>} label="Gasto" color="bg-rose-500" />
          <Tab active={type === 'income'} onClick={() => setType('income')} icon={<ArrowUpRight size={16}/>} label="Receita" color="bg-emerald-500" />
          <Tab active={type === 'investment'} onClick={() => setType('investment')} icon={<Target size={16}/>} label="Investir" color="bg-indigo-600" />
        </div>

        <div className="space-y-6">
          <div className="text-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2">Valor Total</span>
             <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-slate-300">R$</span>
                <input 
                   type="number" 
                   autoFocus
                   placeholder="0,00"
                   value={amount}
                   onChange={e => setAmount(e.target.value)}
                   className="text-5xl font-black bg-transparent outline-none text-center w-48 text-slate-900 placeholder:text-slate-100" 
                />
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                {type === 'expense' ? <Layers className="text-slate-400" size={20} /> : type === 'income' ? <ArrowUpRight className="text-emerald-500" size={20} /> : <Target className="text-indigo-600" size={20} />}
                <input 
                  type="text" 
                  placeholder={type === 'expense' ? "No que você gastou?" : type === 'income' ? "Qual a origem dessa receita?" : "Qual o investimento? (Ex: CDB, Ações)"} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-transparent outline-none w-full font-medium text-sm text-slate-800" 
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                   <Calendar className="text-slate-400" size={18} />
                   <input 
                    type="date" 
                    className="bg-transparent outline-none text-xs font-bold uppercase w-full font-sans" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                   <Wallet className="text-slate-400" size={18} />
                    <select 
                     className="bg-transparent outline-none text-xs font-bold uppercase w-full bg-none appearance-none"
                     value={categoryName}
                     onChange={e => setCategoryName(e.target.value)}
                    >
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))
                      ) : (
                        <option value="">(Crie uma Categoria Primeiro)</option>
                      )}
                    </select>
                </div>
             </div>
          </div>

          {!editingTransaction && type === 'expense' && (
            <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">{installments}x</div>
                <div>
                    <p className="text-xs font-bold text-indigo-900">Parcelar esta compra?</p>
                    <p className="text-[10px] text-indigo-400 font-medium">Dividir em parcelas mensais</p>
                </div>
              </div>
              <input 
                type="number" 
                placeholder="Qtde" 
                value={installments}
                onChange={e => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 p-2 bg-white rounded-xl border border-indigo-100 text-center text-sm font-bold shadow-sm outline-none focus:border-indigo-400" 
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {editingTransaction && (
            <button 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-5 py-4 bg-rose-50 text-rose-600 font-black rounded-3xl active:scale-95 transition-all disabled:opacity-50"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : 'Adicionar agora'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Tab({ active, onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 rounded-xl transition-all ${active ? `${color} text-white shadow-md` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
    >
      <div className={active ? '' : 'text-slate-400'}>{icon}</div>
      <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-tighter">{label}</span>
    </button>
  )
}
