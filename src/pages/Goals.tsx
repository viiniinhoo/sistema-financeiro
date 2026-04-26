import { Target, Calendar, X, Edit3, Trash2 } from 'lucide-react'
import { useFinanceData } from '../hooks/useFinanceData'
import { useState } from 'react'

export function Goals() {
  const { goals, upsertGoal, deleteGoal } = useFinanceData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)

  const handleSave = async (data: any) => {
    const success = await upsertGoal(data)
    if (success) {
      setIsModalOpen(false)
      setEditingGoal(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.')) {
      await deleteGoal(id)
    }
  }

  return (
    <div className="px-6 py-8 pb-32">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Metas</h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Nossos Sonhos Planejados</p>
      </header>

      <div className="space-y-6">
        {goals.map((goal, idx) => (
          <GoalCard 
            key={goal.id}
            icon={goal.icon || '🎯'} 
            title={goal.name} 
            deadline={goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem prazo'} 
            current={goal.current_amount || 0} 
            target={goal.target_amount || 1} 
            color={idx % 2 === 0 ? "bg-indigo-600" : "bg-emerald-500" }
            onEdit={() => { setEditingGoal(goal); setIsModalOpen(true); }}
            onDelete={() => handleDelete(goal.id)}
          />
        ))}

        {goals.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
             <Target size={32} className="text-slate-200 mx-auto mb-3" />
             <p className="text-xs text-slate-400 font-medium">Nenhuma meta ativa</p>
          </div>
        )}
        
        <button 
          onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-400 transition-all shadow-sm"
        >
          + Nova Meta Coletiva
        </button>
      </div>

      {isModalOpen && (
        <GoalModal 
          onClose={() => { setIsModalOpen(false); setEditingGoal(null); }} 
          onSave={handleSave} 
          initialData={editingGoal}
        />
      )}
    </div>
  )
}

function GoalModal({ onClose, onSave, initialData }: any) {
  const [name, setName] = useState(initialData?.name || '')
  const [target, setTarget] = useState(initialData?.target_amount || '')
  const [current, setCurrent] = useState(initialData?.current_amount || '0')
  const [icon, setIcon] = useState(initialData?.icon || '🎯')
  const [deadline, setDeadline] = useState(initialData?.deadline || '')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"><X size={20}/></button>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{initialData ? 'Editar Meta' : 'Nova Meta Coletiva'}</h2>
        
        <div className="space-y-5">
           <div className="flex justify-center mb-4">
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="w-16 h-16 text-center text-3xl bg-slate-50 rounded-2xl border-none outline-indigo-500 shadow-inner" />
           </div>
           
           <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nome do Sonho</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem de Verão" className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Valor Alvo</label>
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="R$ 10.000" className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Já Temos</label>
                <input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="R$ 0" className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
             </div>
           </div>

           <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Prazo (Opcional)</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-indigo-500 font-bold text-slate-800" />
           </div>
        </div>

        <button 
          onClick={() => onSave({ ...initialData, name, target_amount: parseFloat(target), current_amount: parseFloat(current), icon, deadline })}
          className="w-full py-5 mt-10 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-lg"
        >
          {initialData ? 'Salvar Alterações' : 'Salvar Meta'}
        </button>
      </div>
    </div>
  )
}

function GoalCard({ icon, title, deadline, current, target, color, onEdit, onDelete }: any) {
  const progress = Math.min((current / target) * 100, 100)
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-premium transition-all group relative">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
               <Calendar size={12} className="text-slate-300" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{deadline}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
           <button onClick={onEdit} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
              <Edit3 size={18} />
           </button>
           <button onClick={onDelete} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
              <Trash2 size={18} />
           </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
           <p className="text-xs font-bold text-slate-400">Progresso</p>
           <div className="text-right">
              <span className="text-lg font-black text-slate-900">{Math.round(progress)}%</span>
              <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(target)}
              </span>
           </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
           <div className={`${color} h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.2)]`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
