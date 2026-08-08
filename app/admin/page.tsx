'use client'

import { useState, useEffect } from 'react'

type Event = {
  id: string
  title: string
  event_date: string
  location: string
  state: string
  field: string
  capacity: number | null
  registered_count: number
  status: string
}

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak',
  'Selangor', 'Terengganu',
]

const EVENT_FIELDS = [
  'Engineering', 'IT', 'Business', 'Finance', 'Banking, Accounting, Finance & Insurance',
  'Marketing', 'Healthcare', 'Education', 'General',
]

const FIELD_LABELS: { [key: string]: string } = {
  'Banking, Accounting, Finance & Insurance': 'BAFI',
}

const FIELD_COLORS: { [key: string]: string } = {
  'Engineering': '#8B5E34',
  'IT': '#3E6B8B',
  'Business': '#6B5B8B',
  'Finance': '#4A7A5E',
  'Banking, Accounting, Finance & Insurance': '#4A7A5E',
  'Marketing': '#B0623E',
  'Healthcare': '#3E8B7A',
  'Education': '#8B7A3E',
  'General': '#777777',
}

const LOCATIONS_BY_STATE: { [key: string]: string[] } = {
  'Johor': ['Johor Bahru', 'Skudai', 'Batu Pahat', 'Muar'],
  'Kedah': ['Alor Setar', 'Kulim', 'Sungai Petani', 'Langkawi'],
  'Kelantan': ['Kota Bharu', 'Pasir Mas'],
  'Kuala Lumpur': ['Kuala Lumpur City Centre', 'Bangsar', 'Cheras', 'Mont Kiara'],
  'Melaka': ['Melaka City', 'Alor Gajah'],
  'Negeri Sembilan': ['Seremban', 'Port Dickson'],
  'Pahang': ['Kuantan', 'Temerloh'],
  'Penang': ['George Town', 'Bayan Lepas', 'Bukit Mertajam', 'Butterworth'],
  'Perak': ['Ipoh', 'Taiping', 'Sitiawan'],
  'Perlis': ['Kangar'],
  'Putrajaya': ['Putrajaya'],
  'Sabah': ['Kota Kinabalu', 'Sandakan', 'Tawau'],
  'Sarawak': ['Kuching', 'Miri', 'Sibu'],
  'Selangor': ['Klang Valley', 'Shah Alam', 'Petaling Jaya', 'Subang Jaya', 'Puchong'],
  'Terengganu': ['Kuala Terengganu', 'Dungun'],
}

type SortOption = 'date_asc' | 'date_desc'

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [fieldFilter, setFieldFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('date_asc')

  const [form, setForm] = useState({
    title: '',
    event_date: '',
    state: '',
    location: '',
    field: '',
    capacity: '',
  })

  const fetchEvents = async () => {
    setLoading(true)
    const res = await fetch('/api/events')
    const data = await res.json()
    setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const resetForm = () => {
    setForm({ title: '', event_date: '', state: '', location: '', field: '', capacity: '' })
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const payload = {
      title: form.title,
      event_date: form.event_date,
      location: form.location,
      state: form.state,
      field: form.field,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    }

    const url = editingId ? `/api/events/${editingId}` : '/api/events'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.warning || data.error || 'Something went wrong')
      return
    }

    setSuccessMsg(editingId ? 'Saved — your changes are live.' : 'Nicely done — the fair is now listed.')
    resetForm()
    fetchEvents()
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleEdit = (event: Event) => {
    setEditingId(event.id)
    setError('')
    setForm({
      title: event.title,
      event_date: event.event_date,
      state: event.state || '',
      location: event.location || '',
      field: event.field || '',
      capacity: event.capacity?.toString() || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = async (id: string, title: string) => {
    if (!confirm(`Cancel "${title}"? It will be removed from the public calendar.`)) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const states = Array.from(new Set(events.map((e) => e.state).filter(Boolean))).sort()
  const fields = Array.from(new Set(events.map((e) => e.field).filter(Boolean))).sort()

  const filteredEvents = events
    .filter((e) => {
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (stateFilter !== 'all' && e.state !== stateFilter) return false
      if (fieldFilter !== 'all' && e.field !== fieldFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc') return a.event_date.localeCompare(b.event_date)
      return b.event_date.localeCompare(a.event_date)
    })

  const hasActiveFilters = searchQuery !== '' || stateFilter !== 'all' || fieldFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStateFilter('all')
    setFieldFilter('all')
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="heroInner">
          <div className="brand">TALENTBANK</div>
          <h1>Event <em>Management </em> Panel</h1>
          <p>Centralized tools to organize, update, and publish your career fair calendar seamlessly.</p>
        </div>
      </header>

      <main className="content">
        <div className="grid">
          <section className="formCard">
            <h2 className="cardTitle">{editingId ? 'Editing a fair' : 'Add a new fair'}</h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Event title</label>
                <input
                  placeholder="e.g. Engineering Career Fair"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, location: '' })}
                  required
                >
                  <option value="">Select state</option>
                  {MALAYSIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  disabled={!form.state}
                  required
                >
                  <option value="">{form.state ? 'Select location' : 'Select a state first'}</option>
                  {(LOCATIONS_BY_STATE[form.state] || []).map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Field</label>
                <select
                  value={form.field}
                  onChange={(e) => setForm({ ...form, field: e.target.value })}
                  required
                >
                  <option value="">Select field</option>
                  {EVENT_FIELDS.map((f) => (
                    <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Capacity (optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for no limit"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>

              {error && <p className="banner bannerError">{error}</p>}
              {successMsg && <p className="banner bannerSuccess">{successMsg}</p>}

              <div className="formActions">
                <button type="submit" className="primaryBtn">
                  {editingId ? 'Save changes' : 'Add event'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="secondaryBtn">
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="listSection">
            <div className="listHeader">
              <h2 className="cardTitle">Current fairs ({filteredEvents.length}{filteredEvents.length !== events.length ? ` of ${events.length}` : ''})</h2>
            </div>

            <div className="toolbar">
              <input
                className="searchInput"
                placeholder="Search fairs by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                <option value="all">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
                <option value="all">All fields</option>
                {fields.map((f) => (
                  <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                <option value="date_asc">Soonest first</option>
                <option value="date_desc">Latest first</option>
              </select>
              {hasActiveFilters && (
                <button className="clearBtn" onClick={clearFilters}>↺ Clear</button>
              )}
            </div>

            {loading ? (
              <p className="empty">Loading your fairs...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="empty">
                {events.length === 0 ? 'Nothing here yet — add your first fair to get started.' : 'No fairs match your search or filters right now.'}
              </p>
            ) : (
              filteredEvents.map((event) => {
                const fieldColor = FIELD_COLORS[event.field] || '#777777'
                const fieldLabel = FIELD_LABELS[event.field] || event.field
                const isFull = event.capacity !== null && event.registered_count >= event.capacity
                const seatsLeft = event.capacity !== null ? event.capacity - event.registered_count : null
                const isEditing = editingId === event.id

                return (
                  <div key={event.id} className={`eventCard ${isEditing ? 'eventCardEditing' : ''}`}>
                    <div className="eventBar" style={{ background: fieldColor }} />
                    <div className="eventBody">
                      <div className="eventTop">
                        <div className="tagRow">
                          {event.field && (
                            <span className="eventFieldTag" style={{ background: `${fieldColor}1A`, color: fieldColor }}>
                              {fieldLabel}
                            </span>
                          )}
                          {isEditing ? (
                            <span className="editingBadge">✎ Editing now</span>
                          ) : isFull ? (
                            <span className="capacityBadge capacityFull">Fully booked</span>
                          ) : seatsLeft !== null ? (
                            <span className="capacityBadge capacityOpen">{seatsLeft} seats left</span>
                          ) : (
                            <span className="capacityBadge capacityUnlimited">No limit</span>
                          )}
                        </div>
                        <span className="eventDate">{event.event_date}</span>
                      </div>
                      <div className="eventTitle">{event.title}</div>
                      <div className="eventMeta">
                        {event.location} {event.state && `· ${event.state}`}
                      </div>
                      <div className="eventCapacity">
                        Capacity: {event.registered_count}/{event.capacity ?? '∞'}
                      </div>
                      <div className="eventActions">
                        <button onClick={() => handleEdit(event)} className="editBtn">Edit</button>
                        <button onClick={() => handleCancel(event.id, event.title)} className="cancelBtn">Cancel event</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .page {
          font-family: 'IBM Plex Sans', sans-serif;
          background: #F6F4EC;
          min-height: 100vh;
        }
        .hero {
          background: #1B3A2B;
          color: white;
          padding: 44px 20px;
        }
        .heroInner {
          max-width: 1000px;
          margin: 0 auto;
        }
        .brand {
          color: #C79A3E;
          font-weight: 600;
          letter-spacing: 2px;
          font-size: 25px;
          margin-bottom: 12px;
        }
        .hero h1 {
          font-family: 'Spectral', serif;
          font-size: 28px;
          margin: 0 0 6px;
          font-weight: 600;
        }
        .hero h1 em {
          color: #C79A3E;
          font-style: italic;
        }
        .hero p {
          color: #CBD4C8;
          font-size: 14px;
          margin: 0;
        }
        .content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 36px 20px 80px;
        }
        .grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        .cardTitle {
          font-family: 'Spectral', serif;
          font-size: 18px;
          color: #1B3A2B;
          margin: 0;
        }
        .formCard {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(27, 58, 43, 0.08);
          position: sticky;
          top: 20px;
        }
        .formCard .cardTitle {
          margin-bottom: 14px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field label {
          font-size: 11px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field input, .field select {
          padding: 9px 11px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 14px;
          font-family: 'IBM Plex Sans', sans-serif;
          box-sizing: border-box;
        }
        .field input:focus, .field select:focus {
          outline: none;
          border-color: #C79A3E;
        }
        .banner {
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 13px;
          margin: 0;
        }
        .bannerError {
          background: #FCE8E8;
          color: #B23B3B;
        }
        .bannerSuccess {
          background: #E6F0E9;
          color: #1B3A2B;
        }
        .formActions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .primaryBtn {
          background: #1B3A2B;
          color: #F6F4EC;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .primaryBtn:hover {
          background: #2A5040;
        }
        .secondaryBtn {
          background: white;
          color: #1B3A2B;
          border: 1px solid #ddd;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .secondaryBtn:hover {
          background: #F6F4EC;
        }
        .listSection {
          min-width: 0;
        }
        .listHeader {
          margin-bottom: 12px;
        }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          background: white;
          padding: 12px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(27, 58, 43, 0.08);
        }
        .searchInput {
          flex: 1;
          min-width: 160px;
          padding: 8px 11px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .toolbar select {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          background: white;
        }
        .clearBtn {
          background: none;
          border: 1px solid #ddd;
          color: #1B3A2B;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }
        .clearBtn:hover {
          background: #F6F4EC;
        }
        .eventCard {
          display: flex;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(27, 58, 43, 0.08);
          margin-bottom: 14px;
          border: 2px solid transparent;
          transition: border-color 0.2s ease;
        }
        .eventCardEditing {
          border-color: #C79A3E;
          background: #FFFDF6;
        }
        .eventBar {
          width: 6px;
          flex-shrink: 0;
        }
        .eventBody {
          padding: 16px;
          flex: 1;
        }
        .eventTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tagRow {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .eventFieldTag {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
        }
        .capacityBadge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
        }
        .capacityFull {
          background: #FCE8E8;
          color: #B23B3B;
        }
        .capacityOpen {
          background: #E6F0E9;
          color: #1B3A2B;
        }
        .capacityUnlimited {
          background: #F0EFEA;
          color: #999;
        }
        .editingBadge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          background: #C79A3E;
          color: white;
        }
        .eventDate {
          font-size: 12px;
          color: #999;
        }
        .eventTitle {
          font-weight: 600;
          color: #1B3A2B;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .eventMeta {
          font-size: 13px;
          color: #777;
          margin-bottom: 4px;
        }
        .eventCapacity {
          font-size: 13px;
          color: #777;
          margin-bottom: 12px;
        }
        .eventActions {
          display: flex;
          gap: 8px;
        }
        .editBtn {
          background: white;
          border: 1px solid #1B3A2B;
          color: #1B3A2B;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .editBtn:hover {
          background: #F6F4EC;
        }
        .cancelBtn {
          background: white;
          border: 1px solid #B23B3B;
          color: #B23B3B;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .cancelBtn:hover {
          background: #FCE8E8;
        }
        .empty {
          color: #999;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}