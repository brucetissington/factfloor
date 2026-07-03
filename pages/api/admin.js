import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, payload, adminKey } = req.body

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  if (action === 'save_round') {
    const { name, fact, answer } = payload
    await supabase.from('rounds').update({ active: false }).eq('active', true)
    const { error } = await supabase.from('rounds').insert({ name, fact, answer, active: true })
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'add_staff') {
    const { name } = payload
    const { error } = await supabase.from('staff').insert({ name })
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'remove_staff') {
    const { name } = payload
    await supabase.from('staff').delete().eq('name', name)
    return res.json({ ok: true })
  }

  if (action === 'reset_round') {
    const { round_id } = payload
    await supabase.from('guesses').delete().eq('round_id', round_id)
    return res.json({ ok: true })
  }

  if (action === 'close_round') {
    const { round_id } = payload
    const { error } = await supabase.from('rounds').update({ closed: true }).eq('id', round_id)
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'reset_leaderboard') {
    await supabase.from('leaderboard').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    return res.json({ ok: true })
  }

  res.status(400).json({ error: 'Unknown action' })
}
