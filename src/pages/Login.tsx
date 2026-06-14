import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0c10]">
      {/* Background Aesthetic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-2xl shadow-indigo-500/40 mb-6 group transition-transform hover:scale-110 active:scale-95 cursor-pointer">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Minhas Finanças</h1>
          <p className="text-slate-400 font-medium">Controle compartilhado para casais</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <div className="pt-4"></div>

          {error && <p className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            {error}
          </p>}
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">E-mail de Acesso</label>
              <div className="relative group/input">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sua Senha</label>
              <div className="relative group/input">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/40 disabled:opacity-50 mt-4 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group/btn uppercase tracking-widest text-xs"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar no Painel
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-500 text-xs font-medium">
          Sistema Seguro via Supabase Auth &copy; 2026
        </p>
      </div>
    </div>
  )
}
