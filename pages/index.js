import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const ADMIN_KEY_LOCAL = 'factfloor_admin_key'

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('game')
  const [guesser, setGuesser] = useState('')
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [adminKey, setAdminKey] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminForm, setAdminForm] = useState({ name: '', fact: '', answer: '' })
  const [newStaff, setNewStaff] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/data')
    const json = await res.json()
    setData(json)
    setLoading(false)
    if (json.round) {
      setAdminForm({ name: json.round.name, fact: json.round.fact, answer: json.round.answer })
    }
  }, [])

  useEffect(() => {
    fetchData()
    const stored = localStorage.getItem(ADMIN_KEY_LOCAL)
    if (stored) { setAdminKey(stored); setAdminUnlocked(true) }
  }, [fetchData])

  const myGuess = data?.guesses?.find(g => g.guesser === guesser)

  async function submitGuess() {
    if (!selected || !guesser || !data?.round) return
    setSubmitted(true)
    const res = await fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: data.round.id, guesser, answer: selected })
    })
    const json = await res.json()
    setResult({ correct: json.correct, answer: json.roundAnswer })
    fetchData()
  }

  async function adminAction(action, payload) {
    setSaving(true)
    setSaveMsg('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, adminKey })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) {
      setSaveMsg('Error: ' + json.error)
    } else {
      setSaveMsg(action === 'save_round' ? 'Round saved! Guesses have been cleared.' : 'Done.')
      fetchData()
      if (action === 'save_round') setTab('game')
    }
  }

  function unlockAdmin() {
    localStorage.setItem(ADMIN_KEY_LOCAL, adminKey)
    setAdminUnlocked(true)
  }

  const maxPoints = data?.leaderboard?.[0]?.points || 1

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.loadDot} />
    </div>
  )

  return (
    <>
      <Head>
        <title>The Fact Floor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* Header */}
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logoMark}>
                <span style={styles.logoStar}>✦</span>
              </div>
              <div>
                <h1 style={styles.title}>The Fact Floor</h1>
                <p style={styles.subtitle}>Currency Partners · Internal</p>
              </div>
            </div>
            {data?.round && (
              <div style={styles.roundPill}>{data.round.name}</div>
            )}
          </header>

          {/* Tabs */}
          <div style={styles.tabs}>
            {[['game', 'This Round'], ['board', 'Leaderboard'], ['admin', 'Admin']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ ...styles.tab, ...(tab === id ? styles.tabActive : {}) }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── GAME TAB ── */}
          {tab === 'game' && (
            <div>
              {!data?.round ? (
                <div style={styles.emptyState}>No active round. Check back soon.</div>
              ) : (
                <>
                  <div style={styles.factCard}>
                    <div style={styles.factEyebrow}>This round's fun fact</div>
                    <p style={styles.factText}>"{data.round.fact}"</p>
                  </div>

                  {!data.round.closed && (
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Who is this?</label>
                    <select style={styles.select} value={guesser}
                      onChange={e => { setGuesser(e.target.value); setSelected(null); setSubmitted(false); setResult(null) }}>
                      <option value="">Select your name to cast your guess…</option>
                      {data.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  )}

                  {guesser && myGuess && !data.round.closed && (
                    <div style={styles.resultBanner}>
                      Thanks! You'll have to wait and see until the round closes whether you were on the money!
                    </div>
                  )}
                  {guesser && myGuess && data.round.closed && (
                    <div style={{ ...styles.resultBanner, ...(myGuess.correct ? styles.resultCorrect : styles.resultWrong) }}>
                      <strong>{myGuess.correct ? '✓ Correct!' : '✗ Not quite —'}</strong>{' '}
                      {myGuess.correct
                        ? `You correctly guessed ${myGuess.answer}.`
                        : `You guessed ${myGuess.answer}. The answer was ${data.round.answer}.`}
                    </div>
                  )}

                  {guesser && !myGuess && !submitted && !data.round.closed && (
                    <>
                      <label style={{ ...styles.label, marginBottom: '12px', display: 'block' }}>
                        Who does this fact belong to?
                      </label>
                      <div style={styles.namesGrid}>
                        {data.staff.filter(s => s.name !== guesser).map(s => (
                          <button key={s.id} onClick={() => setSelected(s.name)}
                            style={{
                              ...styles.nameBtn,
                              ...(selected === s.name ? styles.nameBtnSelected : {})
                            }}>
                            <span style={styles.nameInitials}>
                              {s.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                            <span style={styles.nameBtnText}>{s.name}</span>
                          </button>
                        ))}
                      </div>
                      <button style={{ ...styles.submitBtn, ...(selected ? {} : styles.submitBtnDisabled) }}
                        disabled={!selected} onClick={submitGuess}>
                        Submit my guess
                      </button>
                    </>
                  )}

                  {submitted && result && !data.round.closed && (
                    <>
                      <div style={styles.namesGrid}>
                        {data.staff.filter(s => s.name !== guesser).map(s => (
                          <button key={s.id} disabled
                            style={{
                              ...styles.nameBtn,
                              ...(s.name === selected && result.correct ? styles.nameBtnCorrect : {}),
                              ...(s.name === selected && !result.correct ? styles.nameBtnWrong : {}),
                              ...(s.name === result.answer && !result.correct ? styles.nameBtnReveal : {}),
                              cursor: 'default'
                            }}>
                            <span style={styles.nameInitials}>
                              {s.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                            <span style={styles.nameBtnText}>{s.name}</span>
                          </button>
                        ))}
                      </div>
                      <div style={styles.resultBanner}>
                        Thanks! You'll have to wait and see until the round closes whether you were on the money!
                      </div>
                    </>
                  )}

                  {data.round.closed && (
                    <div style={styles.resultsSection}>
                      <h3 style={styles.resultsTitle}>Round closed — the answer was <span style={styles.resultsAnswer}>{data.round.answer}</span></h3>
                      <div style={styles.resultsList}>
                        {data.guesses.map(g => (
                          <div key={g.id} style={styles.resultsRow}>
                            <span style={g.correct ? styles.resultsCheck : styles.resultsCross}>
                              {g.correct ? '✓' : '✗'}
                            </span>
                            <span style={styles.resultsGuesser}>{g.guesser}</span>
                            <span style={styles.resultsGuessed}>guessed {g.answer}</span>
                          </div>
                        ))}
                        {data.guesses.length === 0 && (
                          <div style={styles.emptyState}>No guesses were submitted this round.</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── LEADERBOARD TAB ── */}
          {tab === 'board' && (
            <div>
              <h2 style={styles.sectionTitle}>All-time standings</h2>
              {data?.leaderboard?.length === 0 ? (
                <div style={styles.emptyState}>No scores yet — be the first to guess!</div>
              ) : (
                <div style={styles.lbList}>
                  {data.leaderboard.map((entry, i) => (
                    <div key={entry.id} style={{ ...styles.lbRow, ...(i === 0 ? styles.lbRowFirst : {}) }}>
                      <span style={{ ...styles.lbRank, ...(i === 0 ? styles.lbRankGold : {}) }}>
                        {i === 0 ? '✦' : i + 1}
                      </span>
                      <div style={styles.lbAvatar}>
                        {entry.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ ...styles.lbName, color: i === 0 ? '#ffffff' : '#B19764' }}>{entry.name}</span>
                      <div style={styles.lbBarWrap}>
                        <div style={{ ...styles.lbBar, width: `${Math.round((entry.points / maxPoints) * 100)}%` }} />
                      </div>
                      <span style={styles.lbScore}>{entry.points} pt{entry.points !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADMIN TAB ── */}
          {tab === 'admin' && (
            <div>
              {!adminUnlocked ? (
                <div style={styles.adminLock}>
                  <h2 style={styles.sectionTitle}>Admin access</h2>
                  <p style={{ fontSize: '14px', color: '#4a6070', marginBottom: '16px' }}>
                    Enter the admin key to manage rounds and staff.
                  </p>
                  <input style={styles.input} type="password" placeholder="Admin key"
                    value={adminKey} onChange={e => setAdminKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && unlockAdmin()} />
                  <button style={styles.saveBtn} onClick={unlockAdmin}>Unlock</button>
                </div>
              ) : (
                <>
                  <div style={styles.adminCard}>
                    <h3 style={styles.adminCardTitle}>New / current round</h3>
                    <label style={styles.label}>Round name</label>
                    <input style={styles.input} value={adminForm.name}
                      onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. June 2026" />
                    <label style={styles.label}>The fun fact</label>
                    <textarea style={styles.textarea} value={adminForm.fact}
                      onChange={e => setAdminForm(f => ({ ...f, fact: e.target.value }))}
                      placeholder="e.g. I once swam with sharks in the Maldives" />
                    <label style={styles.label}>The answer (exact name from staff list)</label>
                    <input style={styles.input} value={adminForm.answer}
                      onChange={e => setAdminForm(f => ({ ...f, answer: e.target.value }))}
                      placeholder="Full name as it appears in the staff list" />
                    <button style={styles.saveBtn} disabled={saving}
                      onClick={() => adminAction('save_round', adminForm)}>
                      {saving ? 'Saving…' : 'Save round'}
                    </button>
                    {saveMsg && <p style={styles.saveMsg}>{saveMsg}</p>}
                  </div>

                  <div style={styles.adminCard}>
                    <h3 style={styles.adminCardTitle}>Staff list</h3>
                    <div style={styles.staffTags}>
                      {data?.staff?.map(s => (
                        <button key={s.id} style={styles.staffTag}
                          onClick={() => adminAction('remove_staff', { name: s.name })}>
                          {s.name} ×
                        </button>
                      ))}
                    </div>
                    <div style={styles.addRow}>
                      <input style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                        value={newStaff} onChange={e => setNewStaff(e.target.value)}
                        placeholder="Add staff member name"
                        onKeyDown={e => { if (e.key === 'Enter') { adminAction('add_staff', { name: newStaff }); setNewStaff('') } }} />
                      <button style={styles.addBtn}
                        onClick={() => { adminAction('add_staff', { name: newStaff }); setNewStaff('') }}>
                        Add
                      </button>
                    </div>
                  </div>

                  <div style={styles.adminCard}>
                    <h3 style={styles.adminCardTitle}>Votes so far</h3>
                    <p style={{ fontSize: '13px', color: '#4a6070', marginBottom: '12px' }}>
                      {data?.guesses?.length || 0} of {data?.staff?.length || 0} have voted
                    </p>
                    {!data?.guesses?.length ? (
                      <p style={{ fontSize: '14px', color: '#4a6070' }}>No votes yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {data.guesses.map(g => (
                          <div key={g.id} style={styles.voteRow}>
                            {data.round?.closed && (
                              <span style={g.correct ? styles.resultsCheck : styles.resultsCross}>
                                {g.correct ? '✓' : '✗'}
                              </span>
                            )}
                            <span style={styles.resultsGuesser}>{g.guesser}</span>
                            <span style={styles.resultsGuessed}>guessed {g.answer}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={styles.adminCard}>
                    <h3 style={{ ...styles.adminCardTitle, color: '#8b2020' }}>Danger zone</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button style={styles.dangerBtn}
                        onClick={() => { if (confirm('Reset the leaderboard? This cannot be undone.')) adminAction('reset_leaderboard', {}) }}>
                        Reset leaderboard
                      </button>
                      {data?.round && !data.round.closed && (
                        <button style={styles.closeBtn}
                          onClick={() => { if (confirm('Close this round and reveal results? This cannot be undone.')) adminAction('close_round', { round_id: data.round.id }) }}>
                          Close round &amp; reveal
                        </button>
                      )}
                      {data?.round?.closed && (
                        <span style={{ fontSize: '13px', color: '#4a6070', alignSelf: 'center' }}>This round is closed.</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#E4F1F4', padding: '2rem 1rem 4rem' },
  container: { maxWidth: '680px', margin: '0 auto' },
  loadWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E4F1F4' },
  loadDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#B19764', animation: 'pulse 1s infinite' },

  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  logoMark: { width: '44px', height: '44px', borderRadius: '10px', background: '#024854', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoStar: { color: '#B19764', fontSize: '22px', lineHeight: 1 },
  title: { fontFamily: 'Quicksand, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0b1628', letterSpacing: '-0.3px' },
  subtitle: { fontSize: '12px', color: '#4a6070', marginTop: '1px' },
  roundPill: { background: '#024854', color: '#E4F1F4', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' },

  tabs: { display: 'flex', gap: '0', borderBottom: '1px solid rgba(2,72,84,0.15)', marginBottom: '2rem' },
  tab: { padding: '10px 18px', fontSize: '14px', color: '#4a6070', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-1px', fontWeight: 400, cursor: 'pointer' },
  tabActive: { color: '#024854', borderBottomColor: '#024854', fontWeight: 600 },

  factCard: { background: '#024854', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' },
  factEyebrow: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B19764', marginBottom: '12px', fontWeight: 600 },
  factText: { fontFamily: 'Quicksand, sans-serif', fontSize: '20px', fontWeight: 600, color: '#ffffff', lineHeight: 1.5 },

  fieldGroup: { marginBottom: '1.5rem' },
  label: { fontSize: '13px', color: '#4a6070', marginBottom: '6px', display: 'block' },
  select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(2,72,84,0.2)', background: '#ffffff', fontSize: '14px', color: '#0b1628', outline: 'none' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(2,72,84,0.2)', background: '#ffffff', fontSize: '14px', color: '#0b1628', outline: 'none', marginBottom: '14px', display: 'block' },
  textarea: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(2,72,84,0.2)', background: '#ffffff', fontSize: '14px', color: '#0b1628', outline: 'none', marginBottom: '14px', height: '80px', resize: 'vertical', display: 'block' },

  namesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '1.5rem' },
  nameBtn: { background: '#ffffff', border: '1px solid rgba(2,72,84,0.15)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#0b1628', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.1s', textAlign: 'left' },
  nameBtnSelected: { border: '2px solid #024854', background: '#f0f8fa' },
  nameBtnCorrect: { border: '2px solid #1D9E75', background: '#E1F5EE', color: '#085041' },
  nameBtnWrong: { border: '2px solid #E24B4A', background: '#FCEBEB', color: '#791F1F' },
  nameBtnReveal: { border: '2px solid #1D9E75', background: '#E1F5EE', color: '#085041' },
  nameInitials: { width: '26px', height: '26px', borderRadius: '50%', background: '#E4F1F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#024854', flexShrink: 0 },
  nameBtnText: { fontSize: '13px', lineHeight: 1.3 },

  submitBtn: { width: '100%', padding: '14px', background: '#024854', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Quicksand, sans-serif', marginBottom: '1rem' },
  submitBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  resultBanner: { borderRadius: '10px', padding: '14px 18px', fontSize: '14px', lineHeight: 1.5, marginBottom: '1rem', background: '#f0f8fa', border: '1px solid rgba(2,72,84,0.15)', color: '#0b1628' },
  resultCorrect: { background: '#E1F5EE', border: '1px solid #5DCAA5', color: '#085041' },
  resultWrong: { background: '#FCEBEB', border: '1px solid #F09595', color: '#791F1F' },

  emptyState: { textAlign: 'center', color: '#4a6070', fontSize: '14px', padding: '3rem 0' },
  sectionTitle: { fontFamily: 'Quicksand, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0b1628', marginBottom: '1.25rem' },

  lbList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  lbRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#ffffff', borderRadius: '10px', border: '1px solid rgba(2,72,84,0.1)' },
  lbRowFirst: { background: '#024854', border: '1px solid #024854' },
  lbRank: { fontSize: '13px', color: '#4a6070', width: '20px', flexShrink: 0, textAlign: 'center' },
  lbRankGold: { color: '#B19764', fontSize: '16px' },
  lbAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: '#E4F1F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#024854', flexShrink: 0 },
  lbName: { flex: 1, fontSize: '14px', fontWeight: 500 },
  lbBarWrap: { width: '80px', height: '4px', background: 'rgba(2,72,84,0.1)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 },
  lbBar: { height: '100%', background: '#B19764', borderRadius: '2px', transition: 'width 0.4s ease' },
  lbScore: { fontSize: '13px', fontWeight: 600, color: '#024854', flexShrink: 0 },

  adminLock: { maxWidth: '360px' },
  adminCard: { background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(2,72,84,0.12)', padding: '1.5rem', marginBottom: '1rem' },
  adminCardTitle: { fontFamily: 'Quicksand, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0b1628', marginBottom: '1rem' },
  saveBtn: { background: '#024854', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' },
  saveMsg: { fontSize: '13px', color: '#1D9E75', marginTop: '10px' },
  staffTags: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', minHeight: '32px' },
  staffTag: { background: '#E4F1F4', border: '1px solid rgba(2,72,84,0.15)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', color: '#024854', cursor: 'pointer' },
  addRow: { display: 'flex', gap: '8px', alignItems: 'flex-start' },
  addBtn: { background: '#E4F1F4', border: '1px solid rgba(2,72,84,0.2)', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', color: '#024854', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 },
  dangerBtn: { background: 'none', border: '1px solid #E24B4A', color: '#A32D2D', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' },
  ghostBtn: { background: 'none', border: '1px solid rgba(2,72,84,0.2)', color: '#4a6070', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' },
  closeBtn: { background: '#024854', border: 'none', color: '#ffffff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 },

  resultsSection: { marginTop: '1.5rem' },
  resultsTitle: { fontFamily: 'Quicksand, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0b1628', marginBottom: '1rem' },
  resultsAnswer: { color: '#024854' },
  resultsList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  resultsRow: { display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(2,72,84,0.1)' },
  voteRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: '#f7fbfc' },
  resultsCheck: { color: '#1D9E75', fontWeight: 700, fontSize: '15px', flexShrink: 0 },
  resultsCross: { color: '#E24B4A', fontWeight: 700, fontSize: '15px', flexShrink: 0 },
  resultsGuesser: { fontSize: '14px', fontWeight: 600, color: '#0b1628', flex: 1 },
  resultsGuessed: { fontSize: '13px', color: '#4a6070' },
}
