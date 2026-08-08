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

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    event_date: '',
    location: '',
    state: '',
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
    setForm({ title: '', event_date: '', location: '', state: '', field: '', capacity: '' })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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

    resetForm()
    fetchEvents()
  }

  const handleEdit = (event: Event) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      event_date: event.event_date,
      location: event.location || '',
      state: event.state || '',
      field: event.field || '',
      capacity: event.capacity?.toString() || '',
    })
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this event? It will be removed from the public calendar.')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1>Event Admin Panel</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
        <input
          placeholder="Event title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          required
        />
        <input
          placeholder="Location (e.g. Klang Valley)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <input
          placeholder="State (e.g. Selangor)"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        />
        <input
          placeholder="Field (e.g. Engineering)"
          value={form.field}
          onChange={(e) => setForm({ ...form, field: e.target.value })}
        />
        <input
          type="number"
          placeholder="Capacity (optional)"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit">{editingId ? 'Save changes' : 'Add event'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>

      <h2>Current Events</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <strong>{event.title}</strong> — {event.event_date}
              <br />
              {event.location} {event.state && `· ${event.state}`} {event.field && `· ${event.field}`}
              <br />
              Capacity: {event.registered_count}/{event.capacity ?? '∞'}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(event)}>Edit</button>
                <button onClick={() => handleCancel(event.id)}>Cancel event</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}