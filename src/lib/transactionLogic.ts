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
      created_by: input.createdBy
    })
  }

  return await supabase.from('transactions').insert(transactionsToInsert)
}

export async function updateInstallmentGroup(
  transactionId: string, 
  groupId: string | null, 
  householdId: string,
  updatedData: any, 
  applyToFuture: boolean,
  currentInstallmentIndex: number
) {
  if (!applyToFuture || !groupId) {
     return await supabase
       .from('transactions')
       .update(updatedData)
       .eq('id', transactionId)
       .eq('household_id', householdId)
  }
  
  // Edita esta e as seguintes (propagação Nubank-style)
  return await supabase
    .from('transactions')
    .update({
      amount: updatedData.amount,
      category_id: updatedData.category_id
      // Mantemos as descrições originais com as datas originais
    })
    .eq('installment_group_id', groupId)
    .eq('household_id', householdId)
    .gte('installment_current', currentInstallmentIndex)
}
