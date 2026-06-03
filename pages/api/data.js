import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const [{ data: rounds }, { data: staff }] = await Promise.all([
    supabase.from('rounds').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('staff').select('*').order('name')
  ])

  const round = rounds?.[0] || null

  let guesses = []
  if (round) {
    const { data } = await supabase.from('guesses').select('*').eq('round_id', round.id)
    guesses = data || []
  }

  const { data: leaderboard } = await supabase.from('leaderboard').select('*').order('points', { ascending: false })

  res.json({ round, staff: staff || [], guesses, leaderboard: leaderboard || [] })
}
