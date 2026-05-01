import { ArrowRightLeft, LayoutDashboard, Target, Calculator, ListTree, User as UserIcon, BarChart3, Menu, PanelLeftClose, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AddTransaction } from './AddTransaction'

export function Layout({ children }: { children: React.ReactNode }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-[100dvh] bg-white dark:bg-slate-950">
      
      {/* Desktop/Tablet Sidebar (Hidden on Mobile) */}
      <aside className={`hidden md:flex flex-col w-64 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 fixed inset-y-0 z-40 p-6 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="flex items-center justify-between gap-3 mb-10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
               <span className="font-bold text-lg">$</span>
             </div>
             <span className="font-bold text-xl text-slate-900 dark:text-white">Dois</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <PanelLeftClose size={20} />
           </button>
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

      {/* Mobile Backdrop Blur (Full Screen) */}
      {isActionMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setIsActionMenuOpen(false)}
        />
      )}

      {/* Main Content Area (Shifts right on Desktop) */}
      <div className={`flex-1 flex flex-col min-w-0 relative pb-24 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
        
        {/* Mobile Top Bar */}
        <nav className={`sticky top-0 z-30 glass border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center ${isSidebarOpen ? 'md:hidden' : 'flex'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 transition-colors">
               <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <span className="font-bold text-sm">$</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Dois</span>
            </div>
          </div>
          <UserIcon size={20} className="text-slate-400" />
        </nav>

        <main className="flex-1 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation (Hidden on Tablet/Desktop) */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] z-[110]">
          
          {/* Floating Action Menu */}
          {isActionMenuOpen && (
            <div className="absolute bottom-20 right-6 flex flex-col items-end gap-3 z-[120]">
               <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[200ms]">
                 <FloatingActionItem to="/analise" onClick={() => setIsActionMenuOpen(false)} icon={<BarChart3 size={18} />} label="Gráficos" />
               </div>
               <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[100ms]">
                 <FloatingActionItem to="/contas-fixas" onClick={() => setIsActionMenuOpen(false)} icon={<ArrowRightLeft size={18} />} label="Calendário" />
               </div>
               <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both">
                 <FloatingActionItem to="/calculadora" onClick={() => setIsActionMenuOpen(false)} icon={<Calculator size={18} />} label="Simulador" />
               </div>
            </div>
          )}

          <nav className="glass border border-white/20 dark:border-slate-800 rounded-[2.5rem] flex justify-between items-center px-4 py-2 shadow-2xl relative">
            <NavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Home" onClick={() => setIsActionMenuOpen(false)} />
            <NavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" onClick={() => setIsActionMenuOpen(false)} />
            
            {/* Central FAB */}
            <div className="px-2 flex items-center justify-center">
               <button 
                 onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                 className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${isActionMenuOpen ? 'bg-slate-900 rotate-45' : 'bg-indigo-600 shadow-indigo-600/20'}`}
               >
                 <Plus size={24} strokeWidth={2.5} />
               </button>
            </div>

            <NavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Budget" onClick={() => setIsActionMenuOpen(false)} />
            <NavItem to="/metas" active={location.pathname === '/metas'} icon={<Target size={20} />} label="Metas" onClick={() => setIsActionMenuOpen(false)} />
          </nav>
        </div>

        {/* Desktop FAB (Hidden on Mobile) */}
        <div className="hidden md:block fixed bottom-10 right-6 z-40">
           {/* Global desktop FAB removed as per user request to keep it on specific pages only */}
        </div>
      </div>

      {isAddOpen && <AddTransaction onClose={() => setIsAddOpen(false)} />}
    </div>
  )
}

function NavItem({ to, active, icon, label, onClick }: { to: string, active: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  )
}

function FloatingActionItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-100 dark:border-slate-800 px-5 py-3 rounded-full shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-sm whitespace-nowrap min-w-[150px] active:scale-95 group hover:-translate-y-1"
    >
       <div className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
       <span className="text-slate-600 dark:text-slate-300">{label}</span>
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
