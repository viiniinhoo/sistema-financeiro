import { supabase } from './supabase'

export type TransactionInput = {
  householdId: string
  categoryId: string
  description: string
  amount: number
  date: string
  type: string
  isRecurring?: boolean
  recurrenceRule?: string
  installmentTotal?: number
  createdBy: string
  paymentMethod?: string
}

export async function createTransactionWithInstallments(input: TransactionInput) {
  const { installmentTotal = 1, amount, date, householdId } = input
  
  const isInstallment = installmentTotal > 1
  // we generate a unique group id for installments
  const groupId = isInstallment ? crypto.randomUUID() : null
  
  // If installment, total amount is split (or we could interpret that user provided the total purchase value). As per prompt, users launch the purchase and say total installments.
  // We will divide the amount.
  const valuePerInstallment = isInstallment ? amount / installmentTotal : amount
  
  const transactionsToInsert = []
  const startDate = new Date(date + 'T12:00:00Z')
  
  for (let i = 1; i <= installmentTotal; i++) {
    const currentDate = new Date(startDate)
    currentDate.setMonth(currentDate.getMonth() + (i - 1))
    
    const isoDate = currentDate.toISOString().split('T')[0]
    
    transactionsToInsert.push({
      household_id: householdId,
      category_id: input.categoryId,
      description: isInstallment ? `${input.description} (${i}/${installmentTotal})` : input.description,
      amount: valuePerInstallment,
      date: isoDate,
      type: input.type,
      is_recurring: input.isRecurring || false,
      recurrence_rule: input.recurrenceRule || null,
      installment_total: isInstallment ? installmentTotal : null,
      installment_current: isInstallment ? i : null,
      installment_group_id: groupId,
      paid: false, 
      created_by: input.createdBy,
      payment_method: input.paymentMethod || null
    })
  }

  return await supabase.from('transactions').insert(transactionsToInsert)
}

export async function updateInstallmentGroup(
  transactionId: string, 
  groupId: string | null, 
  householdId: string,
  updatedData: any, 
  scope: 'single' | 'future' | 'all',
  currentInstallmentIndex: number
) {
  if (scope === 'single' || !groupId) {
     return await supabase
       .from('transactions')
       .update(updatedData)
       .eq('id', transactionId)
       .eq('household_id', householdId)
  }
  
  const { description, amount, category_id, type, payment_method, date } = updatedData

  const payload: any = {}
  if (amount !== undefined) payload.amount = amount
  if (category_id !== undefined) payload.category_id = category_id
  if (type !== undefined) payload.type = type
  if (payment_method !== undefined) payload.payment_method = payment_method

  let query = supabase
    .from('transactions')
    .update(payload)
    .eq('installment_group_id', groupId)
    .eq('household_id', householdId)

  if (scope === 'future') {
    query = query.gte('installment_current', currentInstallmentIndex)
  }

  const res = await query
  if (res.error) return res

  // Update description for group items if description changed
  if (description) {
    let fetchQuery = supabase
      .from('transactions')
      .select('id, installment_current, installment_total')
      .eq('installment_group_id', groupId)
      .eq('household_id', householdId)

    if (scope === 'future') {
      fetchQuery = fetchQuery.gte('installment_current', currentInstallmentIndex)
    }

    const { data: groupItems } = await fetchQuery
    if (groupItems) {
      const cleanDesc = description.replace(/\s*\(\d+\/\d+\)$/, '').trim()
      for (const item of groupItems) {
        const itemDesc = item.installment_total && item.installment_current
          ? `${cleanDesc} (${item.installment_current}/${item.installment_total})`
          : cleanDesc
        await supabase.from('transactions').update({ description: itemDesc }).eq('id', item.id)
      }
    }
  }

  // Update date for the current transaction
  if (date) {
    await supabase.from('transactions').update({ date }).eq('id', transactionId).eq('household_id', householdId)
  }

  return res
}
