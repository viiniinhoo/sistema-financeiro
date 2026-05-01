import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, X, CheckCircle2, Circle, Clock } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function FixedBills() {
  const { fixedBills, transactions, categories, isSyncing, toggleBillPaid, deleteFixedBill, upsertFixedBill } = useFinanceData()
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingBill, setEditingBill] = useState<any>(null)

  const monthLabel = useMemo(() => format(selectedDate, "MMMM yyyy", { locale: ptBR }), [selectedDate])

  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1))

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
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">Calendário</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Contas Fixas</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-white border border-slate-100 p-1 rounded-full shadow-sm">
              <button onClick={handlePrevMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-slate-800 px-2 min-w-[80px] text-center capitalize">
                {monthLabel}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
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
              className={`flex-shrink-0 w-11 h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200'
              }`}
            >
              <span className="text-[8px] font-black uppercase mb-0.5 opacity-60">Dia</span>
              <span className="text-lg font-bold">{day}</span>
              {hasBills && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600 animate-pulse'}`}></div>
              )}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compromissos para o Dia {selectedDay}</h2>
            {isSyncing && <Clock size={14} className="text-indigo-400 animate-spin" />}
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {(billsByDay[selectedDay] || []).map((bill: any) => {
            const description = bill.name
            const start = startOfMonth(selectedDate)
            const end = endOfMonth(selectedDate)
            
            const isPaid = transactions.some(t => {
              const isNameMatch = t.description === description
              const isInMonth = isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
              return isNameMatch && isInMonth
            })

            return (
              <BillCard 
                  key={bill.id} 
                  bill={{ ...bill, is_paid: isPaid }} 
                  onToggle={() => toggleBillPaid(bill.id, !isPaid, selectedDate)} 
                  onEdit={() => setEditingBill(bill)}
              />
            )
          })}

          {(!billsByDay[selectedDay] || billsByDay[selectedDay].length === 0) && (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
               <p className="text-xs text-slate-400 font-medium">Nada vencendo hoje</p>
            </div>
          )}
        </div>

        {/* Global List View */}
        <div className="mt-12 pt-12 border-t border-slate-100">
           <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Todas as Contas Fixas</h2>
              <button 
                onClick={() => setEditingBill({})}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-tight"
              >
                <Plus size={12} /> Novo
              </button>
           </div>
           
           <div className="grid grid-cols-1 gap-2">
              {fixedBills.map(bill => (
                <div 
                  key={bill.id} 
                  onClick={() => setEditingBill(bill)}
                  className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm active:scale-[0.98] cursor-pointer"
                >
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          const description = bill.name
                          const start = startOfMonth(selectedDate)
                          const end = endOfMonth(selectedDate)
                          const isPaid = transactions.some(t => 
                            t.description === description && 
                            isWithinInterval(new Date(t.date + 'T12:00:00'), { start, end })
                          )
                          toggleBillPaid(bill.id, !isPaid, selectedDate)
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                         {transactions.some(t => 
                            t.description === bill.name && 
                            isWithinInterval(new Date(t.date + 'T12:00:00'), { 
                              start: startOfMonth(selectedDate), 
                              end: endOfMonth(selectedDate) 
                            })
                         ) ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
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
                    </div>
                 </div>
               ))}
           </div>
        </div>
      </div>

      {editingBill && (
        <BillModal 
          categories={categories}
          initialData={editingBill.id ? editingBill : null}
          onClose={() => setEditingBill(null)}
          deleteFixedBill={deleteFixedBill}
          onSave={async (data: any) => {
            const success = await upsertFixedBill({ ...data, id: editingBill.id })
            if (success) setEditingBill(null)
          }}
        />
      )}
    </div>
  )
}

function BillModal({ categories, onClose, onSave, initialData, deleteFixedBill }: any) {
  const [name, setName] = useState(initialData?.name || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [dueDay, setDueDay] = useState(initialData?.due_day?.toString() || '1')
  const [category, setCategory] = useState(initialData?.category || categories.find((c: any) => c.type === 'expense')?.name || 'Geral')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"><X size={20}/></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{initialData ? 'Editar Vencimento' : 'Novo Vencimento'}</h2>
        
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
                 {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                 ))}
                 {categories.filter((c: any) => c.type === 'expense').length === 0 && <option value="Geral">Geral</option>}
              </select>
           </div>
        </div>

        <div className="flex gap-3 mt-8">
          {initialData?.id && (
            <button 
              onClick={async () => {
                if (window.confirm('⚠️ Excluir conta fixa permanentemente?')) {
                  await deleteFixedBill(initialData.id)
                  onClose()
                }
              }}
              className="px-5 py-4 bg-rose-50 text-rose-600 font-black rounded-3xl active:scale-95 transition-all"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={() => onSave({ name, amount: parseFloat(amount), due_day: parseInt(dueDay), category })}
            className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            {initialData?.id ? 'Salvar Alterações' : 'Salvar Vencimento'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BillCard({ bill, onToggle, onEdit }: { bill: any, onToggle: () => void, onEdit: () => void }) {
  return (
    <div 
      onClick={onEdit}
      className={`bg-white border-l-4 ${bill.is_paid ? 'border-l-emerald-500' : 'border-l-indigo-600'} border border-slate-100 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3 relative`}
    >
      {/* Icon & Info */}
      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
         🏦
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 text-sm truncate">{bill.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
           <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${bill.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {bill.is_paid ? 'Pago' : 'Pendente'}
           </span>
           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight truncate">
             {bill.category}
           </span>
        </div>
      </div>

      {/* Amount & Main Action */}
      <div className="text-right flex flex-col items-end gap-1 shrink-0">
         <p className="text-sm font-black text-slate-900 leading-tight">
           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
         </p>
         <button 
           onClick={(e) => {
             e.stopPropagation()
             onToggle()
           }}
           className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-colors ${
             bill.is_paid 
               ? 'bg-slate-100 text-slate-500' 
               : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
           }`}
         >
           {bill.is_paid ? 'Desfazer' : 'Pagar'}
         </button>
      </div>
    </div>
  )
}
