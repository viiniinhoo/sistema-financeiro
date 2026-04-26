import { ArrowRightLeft, LayoutDashboard, Target, Calculator, ListTree, User as UserIcon, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AddTransaction } from './AddTransaction'

export function Layout({ children }: { children: React.ReactNode }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Desktop/Tablet Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 z-40 p-6">
         <div className="flex items-center gap-3 mb-10">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
             <span className="font-bold text-lg">$</span>
           </div>
           <span className="font-bold text-xl text-slate-900 dark:text-white">Finanças Dois</span>
         </div>

         <div className="flex-1 flex flex-col gap-2">
            <DesktopNavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Início" />
            <DesktopNavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" />
            <DesktopNavItem to="/analise" active={location.pathname === '/analise'} icon={<BarChart3 size={20} />} label="Gráficos" />
            <DesktopNavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Orçamento" />
            <DesktopNavItem to="/metas" active={location.pathname === '/metas'} icon={<Target size={20} />} label="Metas" />
            <DesktopNavItem to="/calculadora" active={location.pathname === '/calculadora'} icon={<Calculator size={20} />} label="Simulador" />
         </div>
         
         <button className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors mt-auto">
            <UserIcon size={20} />
            Sair da Conta
         </button>
      </aside>

      {/* Main Content Area (Shifts right on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 relative pb-24 md:pb-0">
        
        {/* Mobile Top Bar */}
        <nav className="sticky top-0 z-30 glass border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center sm:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <span className="font-bold text-sm">$</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Dois</span>
          </div>
          <UserIcon size={20} className="text-slate-400" />
        </nav>

        <main className="flex-1 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        {/* Floating Action Button (Visible on both, positioned differently) */}
        <div className="fixed bottom-28 md:bottom-10 right-6 z-40">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 hover:-translate-y-2 transition-all active:scale-95"
          >
            <span className="text-4xl font-light">+</span>
          </button>
        </div>

        {/* Mobile Bottom Navigation (Hidden on Tablet/Desktop) */}
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] glass border border-white/20 dark:border-slate-800 rounded-3xl flex justify-between px-2 py-2 z-40 shadow-2xl">
          <NavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Home" />
          <NavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" />
          <NavItem to="/analise" active={location.pathname === '/analise'} icon={<BarChart3 size={20} />} label="Gráficos" />
          <NavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Budget" />
          <NavItem to="/metas" active={location.pathname === '/metas'} icon={<Target size={20} />} label="Metas" />
          <NavItem to="/calculadora" active={location.pathname === '/calculadora'} icon={<Calculator size={20} />} label="Simular" />
        </nav>
      </div>

      {isAddOpen && <AddTransaction onClose={() => setIsAddOpen(false)} />}
    </div>
  )
}

function NavItem({ to, active, icon, label }: { to: string, active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link to={to} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  )
}

function DesktopNavItem({ to, active, icon, label }: { to: string, active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}>
      {icon}
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>}
    </Link>
  )
}
