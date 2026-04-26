import { Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Plus, Trash2, X } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { useState, useMemo } from 'react'

export function FixedBills() {
  const { fixedBills, categories, isSyncing, toggleBillPaid, deleteFixedBill, upsertFixedBill } = useFinanceData()
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [isModalOpen, setIsModalOpen] = useState(false)

  const billsByDay = useMemo(() => {
    const map: Record<number, any[]> = {}
    fixedBills.forEach(bill => {
      const day = bill.due_day
      if (!map[day]) map[day] = []
      map[day].push(bill)
    })
    return map
  }, [fixedBills])

  return (
    <div className="px-6 py-8 pb-32 md:pb-12 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Calendário</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Nossos Vencimentos Mensais</p>
      </header>

      {/* Calendar Strip */}
      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6">
        {[...Array(31)].map((_, i) => {
          const day = i + 1
          const hasBills = !!billsByDay[day]
          const isSelected = selectedDay === day
          return (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200'
              }`}
            >
              <span className="text-[10px] font-black uppercase mb-1 opacity-60">Dia</span>
              <span className="text-xl font-bold">{day}</span>
              {hasBills && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600 animate-pulse'}`}></div>
              )}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Compromissos para o Dia {selectedDay}</h2>
            {isSyncing && <Clock size={14} className="text-indigo-400 animate-spin" />}
        </div>

        <div className="space-y-4">
          {(billsByDay[selectedDay] || []).map((bill: any) => (
            <BillCard 
                key={bill.id} 
                bill={bill} 
                onToggle={() => toggleBillPaid(bill.id, !bill.is_paid)} 
                onDelete={async () => {
                   if (window.confirm('⚠️ Deseja excluir este vencimento mensal permanentemente?')) {
                      await deleteFixedBill(bill.id)
                   }
                }}
            />
          ))}

          {(!billsByDay[selectedDay] || billsByDay[selectedDay].length === 0) && (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
               <CalendarIcon size={32} className="text-slate-200 mx-auto mb-3" />
               <p className="text-xs text-slate-400 font-medium">Nada vencendo hoje</p>
            </div>
          )}
        </div>

        {/* Global List View */}
        <div className="mt-12 pt-12 border-t border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Todas as Contas Fixas</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all"
              >
                <Plus size={14} /> Novo
              </button>
           </div>
           
           <div className="space-y-3">
              {fixedBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleBillPaid(bill.id, !bill.is_paid)}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                         {bill.is_paid ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                      </button>
                      <div>
                         <p className="text-sm font-bold text-slate-800">{bill.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Dia {bill.due_day}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-slate-900">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                      </p>
                      <button 
                        onClick={async () => {
                          if (window.confirm('⚠️ Excluir conta fixa permanentemente?')) {
                            await deleteFixedBill(bill.id)
                          }
                        }}
                        className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {isModalOpen && (
        <BillModal 
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data: any) => {
            const success = await upsertFixedBill(data)
            if (success) setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function BillModal({ categories, onClose, onSave }: any) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('1')
  const [category, setCategory] = useState(categories[0]?.name || 'Geral')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"><X size={20}/></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Novo Vencimento</h2>
        
        <div className="space-y-5">
           <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Descrição da Conta</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aluguel, Luz..." className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Valor Mensal</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Dia do Vencimento</label>
                <select value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800 appearance-none">
                   {[...Array(31)].map((_, i) => (
                      <option key={i+1} value={i+1}>Dia {i+1}</option>
                   ))}
                </select>
             </div>
           </div>

           <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Categoria de Gasto</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800 appearance-none">
                 {categories.map((c: any) => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                 ))}
                 {categories.length === 0 && <option value="Geral">Geral</option>}
              </select>
           </div>
        </div>

        <button 
          onClick={() => onSave({ name, amount: parseFloat(amount), due_day: parseInt(dueDay), category })}
          className="w-full py-5 mt-10 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-lg"
        >
          Salvar Vencimento
        </button>
      </div>
    </div>
  )
}

function BillCard({ bill, onToggle, onDelete }: { bill: any, onToggle: () => void, onDelete: () => void }) {
  return (
    <div className={`bg-white border-l-4 ${bill.is_paid ? 'border-l-emerald-500' : 'border-l-indigo-600'} border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-premium transition-all group`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
             🏦
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{bill.name}</h4>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${bill.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {bill.is_paid ? 'Pago' : 'Pendente'}
               </span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Budget: {bill.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}</p>
             <button 
               onClick={onToggle}
               className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2 hover:underline"
             >
               {bill.is_paid ? 'Desmarcar' : 'Marcar Pago'}
             </button>
          </div>
          <button 
            onClick={onDelete}
            className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
