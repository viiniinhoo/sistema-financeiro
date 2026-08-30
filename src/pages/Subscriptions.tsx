import { useState, useMemo } from 'react'
import { Plus, Trash2, Power } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { format } from 'date-fns'

export function Subscriptions() {
  const { subscriptions, categories, upsertSubscription, deleteSubscription, toggleSubscriptionActive } = useFinanceData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<any>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [billingDate, setBillingDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [icon, setIcon] = useState('💳')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Metrics
  const activeSubs = useMemo(() => subscriptions.filter(s => s.is_active), [subscriptions])
  
  const monthlyTotal = useMemo(() => {
    return activeSubs.reduce((acc, s) => acc + (Number(s.amount) || 0), 0)
  }, [activeSubs])

  const annualTotal = useMemo(() => monthlyTotal * 12, [monthlyTotal])

  const nextBilling = useMemo(() => {
    const today = new Date().getDate()
    const sorted = [...activeSubs].sort((a, b) => {
      const dayA = a.billing_day >= today ? a.billing_day : a.billing_day + 31
      const dayB = b.billing_day >= today ? b.billing_day : b.billing_day + 31
      return dayA - dayB
    })
    return sorted[0] || null
  }, [activeSubs])

  const handleOpenModal = (sub?: any) => {
    const today = new Date()
    const currentYearMonth = format(today, 'yyyy-MM')

    if (sub) {
      setEditingSub(sub)
      setName(sub.name)
      setAmount(sub.amount.toString())
      setCategory(sub.category || '')
      const dayStr = (sub.billing_day || 10).toString().padStart(2, '0')
      setBillingDate(`${currentYearMonth}-${dayStr}`)
      setIcon(sub.icon || '💳')
    } else {
      setEditingSub(null)
      setName('')
      setAmount('')
      setCategory(categories[0]?.name || 'Lazer')
      setBillingDate(format(today, 'yyyy-MM-dd'))
      setIcon('💳')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount) return

    setIsSubmitting(true)
    const dayParsed = billingDate ? parseInt(billingDate.split('-')[2], 10) : new Date().getDate()

    const payload = {
      id: editingSub ? editingSub.id : undefined,
      name: name.trim(),
      amount: parseFloat(amount),
      category: category || 'Geral',
      billing_day: dayParsed || 1,
      icon: icon || '💳',
      is_active: editingSub ? editingSub.is_active : true
    }

    await upsertSubscription(payload)
    setIsSubmitting(false)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string, subName: string) => {
    if (window.confirm(`Deseja realmente remover a assinatura "${subName}"?`)) {
      await deleteSubscription(id)
    }
  }

  return (
    <div className="px-6 py-8 pb-32 md:pb-12 max-w-5xl mx-auto w-full">
      {/* Header - Aligned with System Standard (FixedBills, Transactions) */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Assinaturas</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Serviços Recorrentes</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <Plus size={16} />
          <span>Nova Assinatura</span>
        </button>
      </header>

      {/* HERO SINGLE METRIC CARD (Analytics Patrimônio Card Pattern) */}
      <div className="mb-6 md:mb-8">
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Mensal em Assinaturas</span>
                <div className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[8px] font-black uppercase tracking-tighter">Serviços Ativos</div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyTotal)}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mt-1 italic">
                {activeSubs.length} {activeSubs.length === 1 ? 'serviço ativo cadastrado' : 'serviços ativos cadastrados'}
              </p>
            </div>

            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-800/80 pt-5 md:pt-0 md:pl-8">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Custo Anual</span>
                <p className="text-lg font-black text-white leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualTotal)}
                </p>
                <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 block">Projeção 12 meses</span>
              </div>
              
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Próxima Fatura</span>
                {nextBilling ? (
                  <>
                    <p className="text-lg font-black text-indigo-400 leading-none truncate max-w-[140px]" title={nextBilling.name}>
                      {nextBilling.name}
                    </p>
                    <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block truncate">
                      Dia {nextBilling.billing_day} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nextBilling.amount)}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black text-slate-400 leading-none">Nenhuma</p>
                    <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 block">Sem pendências</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions List Section */}
      <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Minhas Assinaturas</h2>
      
      {/* MOBILE LIST (Ultra Compact - Click Card to Edit) */}
      <div className="md:hidden space-y-2 mb-4">
        {subscriptions.map(sub => (
          <div
            key={sub.id}
            onClick={() => handleOpenModal(sub)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
              sub.is_active
                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-300'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
            }`}
          >
            {/* Top row: icon + info + actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-base w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                  {sub.icon || '💳'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-white leading-tight break-words">
                    {sub.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{sub.category || 'Geral'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <span className="text-[9px] font-medium text-slate-400">Dia {sub.billing_day} na fatura</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mr-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSubscriptionActive(sub.id, !sub.is_active)
                  }}
                  title={sub.is_active ? 'Desativar' : 'Ativar'}
                  className={`p-1.5 rounded-lg transition-all ${
                    sub.is_active
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'text-slate-400 bg-slate-200/50 dark:bg-slate-800'
                  }`}
                >
                  <Power size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(sub.id, sub.name)
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP GRID (Click Card to Edit) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map(sub => (
          <div
            key={sub.id}
            onClick={() => handleOpenModal(sub)}
            className={`p-5 rounded-2xl border transition-all relative cursor-pointer active:scale-[0.99] ${
              sub.is_active
                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  {sub.icon || '💳'}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    {sub.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                    {sub.category || 'Geral'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSubscriptionActive(sub.id, !sub.is_active)
                  }}
                  title={sub.is_active ? 'Desativar assinatura' : 'Ativar assinatura'}
                  className={`p-2 rounded-xl transition-all ${
                    sub.is_active
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                      : 'text-slate-400 bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-300'
                  }`}
                >
                  <Power size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(sub.id, sub.name)
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contabiliza Dia</p>
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Dia {sub.billing_day} da Fatura</p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Mensal</p>
                <p className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-8 md:py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-400 text-xs md:text-sm font-medium">Nenhuma assinatura cadastrada ainda.</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:underline"
          >
            + Cadastrar primeira assinatura
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Emoji / Icon & Name */}
              <div className="flex gap-3">
                <div className="w-14">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ícone</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    maxLength={2}
                    className="w-full text-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome do Serviço</label>
                  <input
                    type="text"
                    placeholder="Ex: Netflix 4K, Spotify"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Amount & Billing Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data da Fatura</label>
                  <input
                    type="date"
                    value={billingDate}
                    onChange={e => setBillingDate(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Categoria</label>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                  {(() => {
                    const selectedCat = categories.find(c => c.name === category)
                    return selectedCat?.icon ? (
                      <span className="text-sm leading-none">{selectedCat.icon}</span>
                    ) : null
                  })()}
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold outline-none w-full dark:text-white cursor-pointer appearance-none"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ${c.name}` : c.name}</option>
                      ))
                    ) : (
                      <option value="Geral">Geral</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

