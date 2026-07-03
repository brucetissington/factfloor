import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { round_id, guesser, answer } = req.body
  if (!round_id || !guesser || !answer) return res.status(400).json({ error: 'Missing fields' })

  const { data: round } = await supabase.from('rounds').select('answer').eq('id', round_id).single()
  if (!round) return res.status(400).json({ error: 'Round not found' })

  const correct = answer === round.answer

  const { error } = await supabase.from('guesses').insert({ round_id, guesser, answer, correct })
  if (error) return res.status(400).json({ error: error.message })

  res.json({ ok: true, correct, roundAnswer: round.answer })
}
