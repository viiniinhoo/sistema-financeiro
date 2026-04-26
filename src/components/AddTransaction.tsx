import { X, Calendar, Wallet, Layers, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { createTransactionWithInstallments } from '../lib/transactionLogic'
import { useAuth } from '../contexts/AuthContext'
import { useFinanceData } from '../hooks/useFinanceData'

export function AddTransaction({ onClose }: { onClose: () => void }) {
  const { user, householdId } = useAuth()
  const { refreshData, categories } = useFinanceData()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState('')
  const [categoryName, setCategoryName] = useState('Geral')
  
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === type)
  }, [categories, type])

  // Reset category name when type changes to avoid mismatch
  useEffect(() => {
    if (filteredCategories.length > 0) {
      setCategoryName(filteredCategories[0].name)
    } else {
      setCategoryName('Geral')
    }
  }, [type, filteredCategories])

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [installments, setInstallments] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!amount || !description) {
      alert("Por favor, preencha o valor e a descrição!")
      return
    }
    if (!householdId) return
    setIsSubmitting(true)

    const selectedCategory = categories.find(c => c.name === categoryName)
    
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
         console.warn("Keys not found, connection might fail")
      }

      const res = await createTransactionWithInstallments({
        householdId: householdId,
        categoryId: selectedCategory?.id || '11111111-2222-1111-1111-000000000001',
        description,
        amount: parseFloat(amount),
        date,
        type: type as 'income' | 'expense',
        installmentTotal: installments,
        createdBy: user?.user_metadata?.full_name || user?.email || 'Anonymous'
      })
      
      if (res.error) {
        console.error('Supabase Rejection:', res.error)
        alert('Erro do Banco de Dados: ' + res.error.message)
        setIsSubmitting(false)
        return
      }

      await refreshData()
      onClose()
    } catch (error: any) {
      console.error('Network/Internal error:', error)
      alert('Erro de conexão ou servidor. Ele não reconheceu sua chave Supabase. Você reiniciou o npm run dev?')
    } finally {
      setIsSubmitting(false)
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
        
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Novo Registro</h2>

        {/* Type Selector Tabs */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
          <Tab active={type === 'expense'} onClick={() => setType('expense')} icon={<ArrowDownLeft size={16}/>} label="Gasto" color="bg-rose-500" />
          <Tab active={type === 'income'} onClick={() => setType('income')} icon={<ArrowUpRight size={16}/>} label="Receita" color="bg-emerald-500" />
          {/* Investment could be a subtype of expense in this MVP */}
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
                {type === 'expense' ? <Layers className="text-slate-400" size={20} /> : <ArrowUpRight className="text-emerald-500" size={20} />}
                <input 
                  type="text" 
                  placeholder={type === 'expense' ? "No que você gastou?" : "Qual a origem dessa receita?"} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-transparent outline-none w-full font-medium text-sm" 
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                   <Calendar className="text-slate-400" size={18} />
                   <input 
                    type="date" 
                    className="bg-transparent outline-none text-xs font-bold uppercase w-full" 
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
                      {filteredCategories.map((c: any) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      {filteredCategories.length === 0 && <option value="Geral">Geral</option>}
                    </select>
                </div>
             </div>
          </div>

          {/* Installment Switch */}
          {type === 'expense' && (
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

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-5 mt-10 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 text-lg uppercase tracking-wider disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Adicionar agora'}
        </button>
      </div>
    </div>
  )
}

function Tab({ active, onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${active ? `${color} text-white shadow-lg` : 'text-slate-400 opacity-60 hover:opacity-100'}`}
    >
      {icon}
      <span className="uppercase tracking-tighter">{label}</span>
    </button>
  )
}
