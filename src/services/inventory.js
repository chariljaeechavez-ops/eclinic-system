import { supabase } from './supabaseClient'

const SAFE = /^(Insufficient stock|Item not found)/
function friendly(e) {
  if (e.code === '23505') return 'An item with that name and expiry date already exists.'
  if (e.code === '42501') return 'You do not have permission to do that.'
  if (SAFE.test(e.message || '')) return e.message
  return 'Something went wrong. Please try again.'
}

export async function listItems(showArchived) {
  let q = supabase.from('inventory_balances').select('*').order('name').limit(1000)
  if (!showArchived) q = q.eq('is_archived', false)
  const { data, error } = await q
  if (error) throw new Error(friendly(error))
  return data
}

export async function saveItem(v, id) {
  const row = { name: v.name.trim(), category: v.category, unit: v.unit.trim(), low_stock_threshold: Number(v.low_stock_threshold),
    expiry_date: v.expiry_date || null, supplier: v.supplier.trim() || null }
  const { error } = id ? await supabase.from('inventory_items').update(row).eq('id', id) : await supabase.from('inventory_items').insert(row)
  if (error) throw new Error(friendly(error))
}

export async function setItemArchived(id, archived) {
  const { error } = await supabase.from('inventory_items').update({ is_archived: archived }).eq('id', id)
  if (error) throw new Error(friendly(error))
}

export async function recordStock({ itemId, kind, quantity, note, key }) {
  const { error } = await supabase.rpc('record_stock_transaction', { p_item: itemId, p_kind: kind, p_qty: Number(quantity), p_note: note, p_key: key })
  if (error) throw new Error(friendly(error))
}

export async function listTransactions(itemId) {
  const { data, error } = await supabase.from('inventory_transactions').select('id, kind, quantity, note, created_at, profiles(full_name)')
    .eq('item_id', itemId).order('created_at', { ascending: false }).limit(50)
  if (error) throw new Error(friendly(error))
  return data
}
