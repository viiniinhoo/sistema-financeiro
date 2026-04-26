import { ArrowRightLeft, LayoutDashboard, Target, TrendingUp, Calculator, ListTree, User as UserIcon, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AddTransaction } from './AddTransaction'

export function Layout({ children }: { children: React.ReactNode }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen relative pb-24">
      {/* Top Bar Navigation (Desktop-ish or Page Title) */}
      <nav className="sticky top-0 z-30 glass border-b border-slate-100 px-6 py-4 flex justify-between items-center sm:hidden">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
             <span className="font-bold text-sm">$</span>
           </div>
           <span className="font-bold text-slate-900">Dois</span>
         </div>
         <UserIcon size={20} className="text-slate-400" />
      </nav>

      <main className="flex-1 animate-in fade-in duration-500">
        {children}
      </main>
      
      {/* Floating Action Button - Enhanced */}
      <div className="fixed bottom-28 right-6 z-40">
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 hover:bg-slate-900 hover:-translate-y-2 transition-all active:scale-90"
        >
          <span className="text-4xl font-light">+</span>
        </button>
      </div>

      {isAddOpen && <AddTransaction onClose={() => setIsAddOpen(false)} />}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] glass border border-white/20 rounded-3xl flex justify-between px-2 py-2 z-40 shadow-2xl">
        <NavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Home" />
        <NavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" />
        <NavItem to="/analise" active={location.pathname === '/analise'} icon={<BarChart3 size={20} />} label="Gráficos" />
        <NavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Budget" />
        <NavItem to="/metas" active={location.pathname === '/metas'} icon={<Target size={20} />} label="Metas" />
        <NavItem to="/calculadora" active={location.pathname === '/calculadora'} icon={<Calculator size={20} />} label="Simular" />
      </nav>
    </div>
  )
}

function NavItem({ to, active, icon, label }: { to: string, active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link to={to} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  )
}
