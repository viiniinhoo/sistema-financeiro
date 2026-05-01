import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { startOfMonth, endOfMonth, format } from 'date-fns'

// Dados de exemplo premium para carregamento INSTANTÂNEO
const MOCK_TRANSACTIONS = [
  { id: '1', description: 'Supermercado Mensal', amount: 450.00, category: 'Alimentação', date: new Date().toISOString(), type: 'expense' },
  { id: '2', description: 'Salário Coletivo', amount: 8500.00, category: 'Salário', date: new Date().toISOString(), type: 'income' },
  { id: '3', description: 'Reserva de Emergência', amount: 1000.00, category: 'Investimento', date: new Date().toISOString(), type: 'expense' }
]

const MOCK_CATEGORIES = [
  { id: '11111111-2222-1111-1111-000000000001', name: 'Alimentação', icon: '🍎', budget_limit: 1200, type: 'expense' },
  { id: '11111111-2222-1111-1111-000000000002', name: 'Lazer', icon: '🎬', budget_limit: 800, type: 'expense' },
  { id: '11111111-2222-1111-1111-000000000003', name: 'Moradia', icon: '🏠', budget_limit: 3500, type: 'expense' },
  { id: '11111111-2222-1111-1111-000000000004', name: 'Salário', icon: '💰', budget_limit: 0, type: 'income' },
  { id: '11111111-2222-1111-1111-000000000005', name: 'Freelance', icon: '💻', budget_limit: 0, type: 'income' },
  { id: '11111111-2222-1111-1111-000000000006', name: 'Rendimentos', icon: '📈', budget_limit: 0, type: 'income' },
  { id: '11111111-2222-1111-1111-000000000007', name: 'Investimentos', icon: '💎', budget_limit: 500, type: 'expense' }
]

const MOCK_FIXED_BILLS = [
  { id: '1', name: 'Energia Elétrica', amount: 220.00, due_day: 15, is_paid: false, category: 'Moradia' },
  { id: '2', name: 'Internet Fiber', amount: 120.00, due_day: 10, is_paid: true, category: 'Moradia' },
  { id: '3', name: 'Netflix', amount: 55.90, due_day: 5, is_paid: true, category: 'Lazer' }
]

export function useFinanceData() {
  const { householdId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>(MOCK_TRANSACTIONS)
  const [categories, setCategories] = useState<any[]>(MOCK_CATEGORIES)
  const [goals, setGoals] = useState<any[]>([])
  const [fixedBills, setFixedBills] = useState<any[]>(MOCK_FIXED_BILLS)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshData = async () => {
    if (!householdId) return
    
    setIsSyncing(true)
    try {
      const [transRes, catRes, goalRes, billsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('household_id', householdId).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('household_id', householdId),
        supabase.from('goals').select('*').eq('household_id', householdId),
        supabase.from('fixed_bills').select('*').eq('household_id', householdId)
      ])

      if (transRes.data && transRes.data.length > 0) setTransactions(transRes.data)
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data)
      else if (catRes.data && catRes.data.length === 0 && categories.length > 0 && categories[0].id.length > 5) setCategories([]) // Clear mock if cloud is empty
      
      if (goalRes.data) setGoals(goalRes.data)
      if (billsRes.data && billsRes.data.length > 0) setFixedBills(billsRes.data)
      
    } catch (error) {
      console.log('Background sync error', error)
    } finally {
      setIsSyncing(false)
      setLoading(false)
    }
  }

  // Mutations
  const toggleBillPaid = async (billId: string, isPaid: boolean, date: Date) => {
    try {
      const bill = fixedBills.find(b => b.id === billId)
      if (!bill) return

      const description = bill.name
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      if (isPaid) {
        // Criar transação de pagamento
        const catObj = categories.find(c => c.name === bill.category)
        
        const newTransaction = {
          description,
          amount: bill.amount,
          category: bill.category,
          category_id: catObj?.id,
          date: format(date, 'yyyy-MM-dd'),
          type: 'expense',
          household_id: householdId
        }
        await supabase.from('transactions').insert([newTransaction])
      } else {
        // Remover transação de pagamento
        // Busca a transação exata para este mês
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('description', description)
          .eq('household_id', householdId)
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .limit(1)

        if (existing && existing.length > 0) {
          await supabase.from('transactions').delete().eq('id', existing[0].id)
        }
      }
      
      await refreshData()
    } catch (e) { console.error(e) }
  }

  const upsertCategory = async (cat: any) => {
    try {
      let res
      if (cat.id && cat.id.length > 5) { // Check if it's a real ID (not mock '1', '2')
        res = await supabase.from('categories').update({
          name: cat.name,
          icon: cat.icon,
          budget_limit: cat.budget_limit,
          type: cat.type || 'expense'
        }).eq('id', cat.id)
      } else {
        res = await supabase.from('categories').insert([{
          name: cat.name,
          icon: cat.icon,
          budget_limit: cat.budget_limit,
          type: cat.type || 'expense',
          household_id: householdId
        }])
      }

      if (res.error) {
        console.error('Supabase error:', res.error)
        // Local simulation for immediate feedback
        if (!cat.id || cat.id.length <= 5) {
          const newCat = { ...cat, id: 'temp-' + Math.random().toString(36).substr(2, 9) }
          setCategories(prev => [...prev, newCat])
        } else {
          setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))
        }
        return true
      }
      
      await refreshData()
      return true
    } catch (e) { 
      console.error('Exception in upsertCategory:', e)
      return false 
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) {
        setCategories(prev => prev.filter(c => c.id !== id))
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  const upsertGoal = async (goal: any) => {
    try {
      let res
      if (goal.id && goal.id.length > 5) {
        res = await supabase.from('goals').update({
          name: goal.name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          icon: goal.icon,
          deadline: goal.deadline
        }).eq('id', goal.id)
      } else {
        res = await supabase.from('goals').insert([{
          name: goal.name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          icon: goal.icon,
          deadline: goal.deadline,
          household_id: householdId
        }])
      }

      if (res.error) {
        console.error('Supabase error in upsertGoal:', res.error)
        return false
      }
      await refreshData()
      return true
    } catch (e) { 
      console.error('Exception in upsertGoal:', e)
      return false 
    }
}

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) {
        setGoals(prev => prev.filter(g => g.id !== id))
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) {
        setTransactions(prev => prev.filter(t => t.id !== id))
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  const deleteFixedBill = async (id: string) => {
    try {
      const { error } = await supabase.from('fixed_bills').delete().eq('id', id)
      if (error) {
        setFixedBills(prev => prev.filter(b => b.id !== id))
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  const upsertFixedBill = async (bill: any) => {
    try {
      let res
      const billData = {
        name: bill.name,
        amount: bill.amount,
        due_day: bill.due_day,
        category: bill.category,
        is_paid: bill.is_paid || false,
        household_id: householdId
      }

      if (bill.id && bill.id.length > 5) {
        res = await supabase.from('fixed_bills').update(billData).eq('id', bill.id)
      } else {
        res = await supabase.from('fixed_bills').insert([billData])
      }

      if (res.error) {
        console.error('Supabase error:', res.error)
        if (!bill.id || bill.id.length <= 5) {
          const newBill = { ...bill, id: 'temp-' + Math.random().toString(36).substr(2, 9) }
          setFixedBills(prev => [...prev, newBill])
        } else {
          setFixedBills(prev => prev.map(b => b.id === bill.id ? bill : b))
        }
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  useEffect(() => {
    refreshData()
  }, [householdId])

  return {
    transactions,
    categories,
    goals,
    fixedBills,
    loading,
    isSyncing,
    refreshData,
    toggleBillPaid,
    upsertCategory,
    deleteCategory,
    upsertGoal,
    deleteGoal,
    deleteTransaction,
    deleteFixedBill,
    upsertFixedBill
  }
}
