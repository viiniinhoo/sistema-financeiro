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

const MOCK_SUBSCRIPTIONS: any[] = []

export function useFinanceData() {
  const { householdId, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>(MOCK_TRANSACTIONS)
  const [categories, setCategories] = useState<any[]>(MOCK_CATEGORIES)
  const [goals, setGoals] = useState<any[]>([])
  const [fixedBills, setFixedBills] = useState<any[]>(MOCK_FIXED_BILLS)
  const [subscriptions, setSubscriptions] = useState<any[]>(MOCK_SUBSCRIPTIONS)
  const [isSyncing, setIsSyncing] = useState(false)

  const autoSyncSubscriptionsToTransactions = async (
    activeSubs: any[],
    currentTransactions: any[],
    hid: string | null
  ) => {
    if (!activeSubs || activeSubs.length === 0) return

    const now = new Date()
    const currentYearMonth = format(now, 'yyyy-MM')
    const newTransactionsToInsert: any[] = []

    for (const sub of activeSubs) {
      if (sub.is_active === false) continue

      const dayNum = parseInt(sub.billing_day, 10) || 1
      const dayStr = Math.min(31, Math.max(1, dayNum)).toString().padStart(2, '0')
      const targetDate = `${currentYearMonth}-${dayStr}`

      const alreadyExists = currentTransactions.some(
        t => t.description.toLowerCase() === sub.name.toLowerCase() &&
             t.date.startsWith(currentYearMonth) &&
             t.type === 'expense'
      )

      if (!alreadyExists) {
        newTransactionsToInsert.push({
          description: sub.name,
          amount: Number(sub.amount) || 0,
          category: sub.category || 'Geral',
          date: targetDate,
          type: 'expense',
          payment_method: 'Crédito',
          household_id: hid,
          created_by: 'Assinatura'
        })
      }
    }

    if (newTransactionsToInsert.length > 0) {
      const { data, error } = await supabase.from('transactions').insert(newTransactionsToInsert).select()
      if (!error && data && data.length > 0) {
        setTransactions(prev => [...data, ...prev])
      }
    }
  }

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

      let subsRes = await supabase.from('subscriptions').select('*').eq('household_id', householdId)
      if (subsRes.error && (subsRes.error.code === '42703' || subsRes.error.message?.includes('household_id'))) {
        subsRes = user?.id
          ? await supabase.from('subscriptions').select('*').eq('user_id', user.id)
          : await supabase.from('subscriptions').select('*')
      }

      const currentTrans = transRes.data || []
      const currentSubs = subsRes.data || []

      if (currentTrans.length > 0) setTransactions(currentTrans)
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data)
      else if (catRes.data && catRes.data.length === 0 && categories.length > 0 && categories[0].id.length > 5) setCategories([])
      
      if (goalRes.data) setGoals(goalRes.data)
      if (billsRes.data && billsRes.data.length > 0) setFixedBills(billsRes.data)
      if (currentSubs) setSubscriptions(currentSubs)

      // Sync active subscriptions to extrato automatically
      if (currentSubs.length > 0) {
        await autoSyncSubscriptionsToTransactions(currentSubs, currentTrans, householdId)
      }
      
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

  const deleteTransaction = async (
    id: string,
    groupId?: string | null,
    scope: 'single' | 'future' | 'all' = 'single',
    currentInstallmentIndex?: number
  ) => {
    try {
      let query = supabase.from('transactions').delete()

      if (groupId && scope === 'all') {
        query = query.eq('installment_group_id', groupId)
      } else if (groupId && scope === 'future' && currentInstallmentIndex) {
        query = query.eq('installment_group_id', groupId).gte('installment_current', currentInstallmentIndex)
      } else {
        query = query.eq('id', id)
      }

      const { error } = await query

      if (error) {
        if (groupId && scope === 'all') {
          setTransactions(prev => prev.filter(t => t.installment_group_id !== groupId))
        } else if (groupId && scope === 'future' && currentInstallmentIndex) {
          setTransactions(prev => prev.filter(t => !(t.installment_group_id === groupId && (t.installment_current || 0) >= currentInstallmentIndex)))
        } else {
          setTransactions(prev => prev.filter(t => t.id !== id))
        }
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

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) {
        setSubscriptions(prev => prev.filter(s => s.id !== id))
        return true
      }
      await refreshData()
      return true
    } catch (e) { return false }
  }

  const upsertSubscription = async (sub: any) => {
    try {
      let res
      const baseSubData = {
        name: sub.name,
        amount: sub.amount,
        billing_day: sub.billing_day,
        category: sub.category,
        icon: sub.icon || '💳',
        is_active: sub.is_active !== undefined ? sub.is_active : true,
      }

      const subDataWithHousehold = {
        ...baseSubData,
        household_id: householdId,
        ...(user?.id ? { user_id: user.id } : {})
      }

      if (sub.id && sub.id.length > 5 && !sub.id.startsWith('sub-') && !sub.id.startsWith('temp-')) {
        res = await supabase.from('subscriptions').update(subDataWithHousehold).eq('id', sub.id)
        if (res.error && (res.error.code === '42703' || res.error.message?.includes('household_id'))) {
          const subDataNoHousehold = {
            ...baseSubData,
            ...(user?.id ? { user_id: user.id } : {})
          }
          res = await supabase.from('subscriptions').update(subDataNoHousehold).eq('id', sub.id)
        }
      } else {
        res = await supabase.from('subscriptions').insert([subDataWithHousehold]).select()
        if (res.error && (res.error.code === '42703' || res.error.message?.includes('household_id'))) {
          const subDataNoHousehold = {
            ...baseSubData,
            ...(user?.id ? { user_id: user.id } : {})
          }
          res = await supabase.from('subscriptions').insert([subDataNoHousehold]).select()
        }
      }

      if (res?.error) {
        console.error('Supabase error in upsertSubscription:', res.error)
        const localSub = {
          ...baseSubData,
          id: sub.id && sub.id.length > 5 ? sub.id : 'temp-' + Math.random().toString(36).substr(2, 9)
        }
        if (!sub.id || sub.id.startsWith('sub-') || sub.id.startsWith('temp-') || sub.id.length <= 5) {
          setSubscriptions(prev => [...prev, localSub])
        } else {
          setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, ...localSub } : s))
        }
        return true
      }

      await refreshData()
      return true
    } catch (e) { 
      console.error('Exception in upsertSubscription:', e)
      const localSub = {
        name: sub.name,
        amount: sub.amount,
        billing_day: sub.billing_day,
        category: sub.category,
        icon: sub.icon || '💳',
        is_active: sub.is_active !== undefined ? sub.is_active : true,
        id: sub.id && sub.id.length > 5 ? sub.id : 'sub-' + Math.random().toString(36).substr(2, 9)
      }
      if (!sub.id || sub.id.startsWith('sub-') || sub.id.startsWith('temp-') || sub.id.length <= 5) {
        setSubscriptions(prev => [...prev, localSub])
      } else {
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? localSub : s))
      }
      return true 
    }
  }

  const toggleSubscriptionActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('subscriptions').update({ is_active: isActive }).eq('id', id)
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, is_active: isActive } : s))
      if (!error) await refreshData()
      return true
    } catch (e) {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, is_active: isActive } : s))
      return true
    }
  }

  useEffect(() => {
    refreshData()
  }, [householdId])

  return {
    transactions,
    categories,
    goals,
    fixedBills,
    subscriptions,
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
    upsertFixedBill,
    deleteSubscription,
    upsertSubscription,
    toggleSubscriptionActive
  }
}
