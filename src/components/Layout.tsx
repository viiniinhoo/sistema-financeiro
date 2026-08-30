import { ArrowRightLeft, LayoutDashboard, Target, Calculator, ListTree, User as UserIcon, BarChart3, Menu, PanelLeftClose, Plus, LayoutGrid, Repeat } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AddTransaction } from './AddTransaction'
import { useUI } from '../contexts/UIContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, X, Mail, User, ShieldCheck, Edit2, Check, RotateCcw } from 'lucide-react'

export function Layout({ children }: { children: React.ReactNode }) {
  const { isBottomNavVisible, isAddOpen, setIsAddOpen, setAddType } = useUI()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const location = useLocation()

  const handleSignOut = async () => {
    if (window.confirm('Deseja realmente sair da conta?')) {
      await supabase.auth.signOut()
      setIsActionMenuOpen(false)
      setIsProfileOpen(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName }
      })
      if (error) throw error
      setIsEditingName(false)
    } catch (err) {
      console.error('Erro ao atualizar nome:', err)
      alert('Erro ao atualizar nome. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const nomeExibicao = "Minhas Finanças"
  const inicial = "$"

  return (
    <div className="flex min-h-[100dvh] bg-white dark:bg-slate-950">
      
      {/* Desktop/Tablet Sidebar (Hidden on Mobile) */}
      <aside className={`hidden md:flex flex-col w-64 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 fixed inset-y-0 z-40 p-6 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="flex items-center justify-between gap-3 mb-10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
               <span className="font-bold text-lg">{inicial}</span>
             </div>
             <span className="font-bold text-xl text-slate-900 dark:text-white capitalize">{nomeExibicao}</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <PanelLeftClose size={20} />
           </button>
         </div>

         <div className="flex-1 flex flex-col gap-2">
            <DesktopNavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Início" />
            <DesktopNavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" />
            <DesktopNavItem to="/assinaturas" active={location.pathname === '/assinaturas'} icon={<Repeat size={20} />} label="Assinaturas" />
            <DesktopNavItem to="/analise" active={location.pathname === '/analise'} icon={<BarChart3 size={20} />} label="Gráficos" />
            <DesktopNavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Orçamento" />
            <DesktopNavItem to="/metas" active={location.pathname === '/metas'} icon={<Target size={20} />} label="Metas" />
            <DesktopNavItem to="/calculadora" active={location.pathname === '/calculadora'} icon={<Calculator size={20} />} label="Simulador" />
         </div>
         
         <button 
           onClick={async () => await supabase.auth.signOut()}
           className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors mt-auto w-full text-left"
         >
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
        <nav 
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
          className={`sticky top-0 z-30 glass border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center ${isSidebarOpen ? 'md:hidden' : 'flex'}`}
        >
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 transition-colors">
               <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <span className="font-bold text-sm tracking-tighter">{inicial}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white capitalize">{nomeExibicao}</span>
            </div>
          </div>
          <button onClick={() => setIsProfileOpen(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <UserIcon size={20} />
          </button>
        </nav>

        <main className="flex-1 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation (Hidden on Tablet/Desktop) */}
        {isBottomNavVisible && (
          <div 
            style={{ bottom: 0 }}
            className="md:hidden fixed left-0 right-0 w-full z-[110]"
          >
            
            {/* Floating Action Menu */}
            {isActionMenuOpen && (
              <div className="absolute bottom-24 right-6 flex flex-col items-end gap-3 z-[120]">
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both">
                    <FloatingActionItem to="/assinaturas" onClick={() => setIsActionMenuOpen(false)} icon={<Repeat size={18} />} label="Assinaturas" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[75ms]">
                    <FloatingActionItem to="/metas" onClick={() => setIsActionMenuOpen(false)} icon={<Target size={18} />} label="Metas" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[150ms]">
                    <FloatingActionItem to="/analise" onClick={() => setIsActionMenuOpen(false)} icon={<BarChart3 size={18} />} label="Gráficos" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[225ms]">
                    <FloatingActionItem to="/contas-fixas" onClick={() => setIsActionMenuOpen(false)} icon={<ArrowRightLeft size={18} />} label="Calendário" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 fill-mode-both delay-[300ms]">
                    <FloatingActionItem to="/calculadora" onClick={() => setIsActionMenuOpen(false)} icon={<Calculator size={18} />} label="Simulador" />
                  </div>
              </div>
            )}

            <nav 
              style={{ paddingBottom: 'calc(0.2rem + env(safe-area-inset-bottom, 0px))' }}
              className="glass border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-4 pt-2 shadow-2xl relative"
            >
              <NavItem to="/" active={location.pathname === '/'} icon={<LayoutDashboard size={20} />} label="Home" onClick={() => setIsActionMenuOpen(false)} />
              <NavItem to="/transacoes" active={location.pathname === '/transacoes'} icon={<ArrowRightLeft size={20} />} label="Extrato" onClick={() => setIsActionMenuOpen(false)} />
              
              {/* Central FAB */}
              <div className="px-2 flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setAddType('expense');
                      setIsAddOpen(true);
                      setIsActionMenuOpen(false);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 bg-indigo-600 shadow-indigo-600/20`}
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </button>
              </div>

              <NavItem to="/categorias" active={location.pathname === '/categorias'} icon={<ListTree size={20} />} label="Orçamento" onClick={() => setIsActionMenuOpen(false)} />
               <div 
                 onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                 className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all cursor-pointer ${isActionMenuOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <LayoutGrid size={20} />
                 <span className="text-[10px] font-bold">Mais</span>
               </div>
            </nav>
          </div>
        )}

        {/* Desktop FAB (Hidden on Mobile) */}
        <div className="hidden md:block fixed bottom-10 right-6 z-40">
           {/* Global desktop FAB removed as per user request to keep it on specific pages only */}
        </div>
      </div>

      {isAddOpen && <AddTransaction onClose={() => setIsAddOpen(false)} />}
      
      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsProfileOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-10 duration-500">
             <button onClick={() => setIsProfileOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
             </button>
             
             <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 relative group/avatar">
                  <User size={32} />
                  {!isEditingName && (
                    <button 
                      onClick={() => {
                        setNewName(user?.user_metadata?.full_name || '')
                        setIsEditingName(true)
                      }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                
                {isEditingName ? (
                  <div className="w-full space-y-3 animate-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Seu nome completo"
                      autoFocus
                      className="w-full text-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-indigo-500/30 rounded-xl text-slate-900 dark:text-white font-bold outline-none ring-2 ring-indigo-500/10"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingName(false)}
                        disabled={isUpdating}
                        className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleUpdateName}
                        disabled={isUpdating || !newName.trim()}
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <RotateCcw size={14} className="animate-spin" /> : <Check size={14} />}
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {user?.user_metadata?.full_name || 'Usuário'}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mt-1">
                      <Mail size={12} /> {user?.email}
                    </p>
                  </>
                )}
             </div>

             <div className="space-y-3 mb-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800/50">
                   <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <ShieldCheck size={20} />
                   </div>
                   <div className="flex-1 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status da Conta</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Verificada</p>
                   </div>
                </div>
             </div>

             <button 
               onClick={handleSignOut}
               className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
             >
               <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
               Sair do Sistema
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NavItem({ to, active, icon, label, onClick }: { to: string, active: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
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
