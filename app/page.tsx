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

const FIELD_LABELS: { [key: string]: string } = {
  'Banking, Accounting, Finance & Insurance': 'BAFI',
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildCalendarMatrix(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { date: Date; inMonth: boolean }[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false })
    nextDay++
  }
  return cells
}

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(dateStr)
  const diffTime = eventDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const [stateFilter, setStateFilter] = useState('all')
  const [fieldFilter, setFieldFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data: Event[]) => {
        setEvents(data)
        setLoading(false)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = data
          .filter((e) => new Date(e.event_date) >= today)
          .sort((a, b) => a.event_date.localeCompare(b.event_date))
        if (upcoming.length > 0) {
          setCalendarDate(new Date(upcoming[0].event_date))
        }
      })
  }, [])

  const states = Array.from(new Set(events.map((e) => e.state).filter(Boolean))).sort()
  const fields = Array.from(new Set(events.map((e) => e.field).filter(Boolean))).sort()
  const years = Array.from(
    new Set(events.map((e) => new Date(e.event_date).getFullYear().toString()))
  ).sort()

  const baseFiltered = events.filter((e) => {
    if (stateFilter !== 'all' && e.state !== stateFilter) return false
    if (fieldFilter !== 'all' && e.field !== fieldFilter) return false
    if (yearFilter !== 'all' && new Date(e.event_date).getFullYear().toString() !== yearFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = e.title.toLowerCase().includes(q)
      const matchesLocation = e.location.toLowerCase().includes(q)
      const matchesState = e.state.toLowerCase().includes(q)
      if (!matchesTitle && !matchesLocation && !matchesState) return false
    }
    return true
  })

  const eventsByDate: { [key: string]: Event[] } = {}
  baseFiltered.forEach((e) => {
    if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = []
    eventsByDate[e.event_date].push(e)
  })

  const listEvents = (selectedDate ? baseFiltered.filter((e) => e.event_date === selectedDate) : baseFiltered)
    .slice()
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const matrix = buildCalendarMatrix(calendarDate.getFullYear(), calendarDate.getMonth())
  const monthLabel = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayStr = toDateStr(new Date())

  const handleDayClick = (cell: { date: Date; inMonth: boolean }) => {
    const dStr = toDateStr(cell.date)
    if (!cell.inMonth) {
      setCalendarDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
      return
    }
    const hasEvents = (eventsByDate[dStr] || []).length > 0
    if (!hasEvents) return
    setSelectedDate((prev) => (prev === dStr ? null : dStr))
  }

  const resetFilters = () => {
    setStateFilter('all')
    setFieldFilter('all')
    setYearFilter('all')
    setSelectedDate(null)
    setSearchQuery('')
  }

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
    : null

  return (
    <div className="page">
      <header className="hero">
        <div className="heroInner">
          <div className="brand">TALENTBANK</div>
          <h1>Where careers <em>begin</em>.</h1>
          <p>Connecting Malaysia&apos;s top talent with leading employers from coast to coast. Your career path starts now.</p>
          <div className="statStrip">
            <span><strong>{events.length}</strong> fairs listed</span>
            <span className="dot">·</span>
            <span><strong>{states.length}</strong> states</span>
            <span className="dot">·</span>
            <span><strong>{fields.length}</strong> fields</span>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="sectionHeader">
          <span className="eyebrow">The Calendar</span>
          <h2>Find your next fair</h2>
        </div>

        <div className="layout">
          <aside className="sidebar">
            <div className="calendarCard">
              <div className="calHeader">
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>‹</button>
                <span>{monthLabel}</span>
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="weekRow">
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div className="calGrid">
                {matrix.map((cell, i) => {
                  const dStr = toDateStr(cell.date)
                  const dayEvents = eventsByDate[dStr] || []
                  const isSelected = selectedDate === dStr
                  const isToday = dStr === todayStr
                  return (
                    <button
                      key={i}
                      className={`calCell ${!cell.inMonth ? 'calCellMuted' : ''} ${isSelected ? 'calCellSelected' : ''} ${isToday ? 'calCellToday' : ''}`}
                      onClick={() => handleDayClick(cell)}
                    >
                      <span className="calNum">{cell.date.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <span className="calDots">
                          {dayEvents.slice(0, 3).map((ev, idx) => (
                            <span key={idx} className="calDot" style={{ background: FIELD_COLORS[ev.field] || '#999' }} />
                          ))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedDate && (
                <button className="clearDateBtn" onClick={() => setSelectedDate(null)}>
                  Clear date ({selectedDateLabel}) ✕
                </button>
              )}
            </div>

            {fields.length > 0 && (
              <div className="legendCard">
                <div className="legendTitle">Filter by field</div>
                {fields.map((f) => (
                  <button
                    key={f}
                    className={`legendItem ${fieldFilter === f ? 'legendItemActive' : ''}`}
                    onClick={() => setFieldFilter(fieldFilter === f ? 'all' : f)}
                  >
                    <span className="legendDot" style={{ background: FIELD_COLORS[f] || '#999' }} />
                    <span>{FIELD_LABELS[f] || f}</span>
                    <span className="legendCount">{events.filter((e) => e.field === f).length}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="moreFilters">
              <label>State</label>
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                <option value="all">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label>Year</label>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="resetBtn" onClick={resetFilters}>↺ Reset filters</button>
            </div>
          </aside>

          <div className="listPane">
            <input
              className="searchInput"
              placeholder="Search by event name, location, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="listMeta">
              {listEvents.length} events shown
              {selectedDate && ` · filtered to ${selectedDateLabel}`}
            </div>

            {loading ? (
              <p className="empty">Loading events...</p>
            ) : listEvents.length === 0 ? (
              <p className="empty">No events found. Try adjusting your filters.</p>
            ) : (
              listEvents.map((event, idx) => {
                const eventDay = new Date(event.event_date)
                const day = eventDay.getDate()
                const mon = eventDay.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                const days = daysUntil(event.event_date)
                const isFull = event.capacity !== null && event.registered_count >= event.capacity
                const fieldColor = isFull ? '#999999' : (FIELD_COLORS[event.field] || '#777777')
                const fieldLabel = FIELD_LABELS[event.field] || event.field

                return (
                  <div key={event.id} className="eventCard" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="eventBar" style={{ background: fieldColor }} />
                    <div className="eventContent">
                      <div className="eventLeft">
                        {event.field && (
                          <span className="eventFieldTag" style={{ background: `${fieldColor}1A`, color: fieldColor }}>
                            {fieldLabel}
                          </span>
                        )}
                        <div className="eventTitle">{event.title}</div>
                        <div className="eventLocation">{event.location}{event.state && ` · ${event.state}`}</div>
                        <div className="eventStatus">
                          {isFull ? (
                            <span className="full">Fully booked</span>
                          ) : days >= 0 ? (
                            <span className="countdown">In {days} days</span>
                          ) : (
                            <span className="past">Past event</span>
                          )}
                        </div>
                      </div>
                      <div className="eventRight">
                        <div className="eventDay" style={{ color: fieldColor }}>{day}</div>
                        <div className="eventMon" style={{ color: fieldColor }}>{mon}</div>
                        <button className="eventRegisterBtn" disabled={isFull}>
                          {isFull ? 'Full' : 'Register →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
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
          padding: 56px 20px;
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
          margin-bottom: 16px;
        }
        .hero h1 {
          font-family: 'Spectral', serif;
          font-size: 36px;
          margin: 0 0 12px;
          font-weight: 600;
        }
        .hero h1 em {
          color: #C79A3E;
          font-style: italic;
        }
        .hero p {
          color: #CBD4C8;
          font-size: 15px;
          max-width: 480px;
          margin: 0 0 20px;
        }
        .statStrip {
          font-size: 13px;
          color: #C79A3E;
        }
        .statStrip strong {
          color: white;
        }
        .statStrip .dot {
          margin: 0 8px;
          color: #4A6B54;
        }
        .content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 44px 20px 80px;
        }
        .sectionHeader {
          text-align: center;
          margin-bottom: 28px;
        }
        .eyebrow {
          color: #C79A3E;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .sectionHeader h2 {
          font-family: 'Spectral', serif;
          margin: 8px 0 0;
          font-size: 26px;
          color: #1B3A2B;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 720px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .calendarCard, .legendCard, .moreFilters {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(27, 58, 43, 0.08);
        }
        .calHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-family: 'Spectral', serif;
          font-weight: 600;
          color: #1B3A2B;
          font-size: 14px;
        }
        .calHeader button {
          background: none;
          border: none;
          color: #1B3A2B;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .calHeader button:hover {
          background: #F6F4EC;
        }
        .weekRow {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 9px;
          color: #999;
          margin-bottom: 4px;
        }
        .calGrid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .calCell {
          background: none;
          border: none;
          padding: 5px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          border-radius: 6px;
          font-family: 'IBM Plex Sans', sans-serif;
          cursor: default;
        }
        .calCell:not(.calCellMuted) {
          cursor: pointer;
        }
        .calCell:hover:not(.calCellMuted) {
          background: #F6F4EC;
        }
        .calNum {
          font-size: 12px;
          color: #1B3A2B;
        }
        .calCellMuted .calNum {
          color: #ddd;
        }
        .calCellToday .calNum {
          font-weight: 700;
          color: #C79A3E;
        }
        .calCellSelected {
          background: #1B3A2B;
        }
        .calCellSelected .calNum {
          color: white;
          font-weight: 700;
        }
        .calDots {
          display: flex;
          gap: 2px;
          height: 5px;
        }
        .calDot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
        }
        .clearDateBtn {
          margin-top: 10px;
          width: 100%;
          background: #F6F4EC;
          border: 1px solid #ddd;
          color: #1B3A2B;
          font-size: 11px;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
        }
        .legendTitle {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 10px;
        }
        .legendItem {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: none;
          border: none;
          padding: 7px 6px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #1B3A2B;
          text-align: left;
        }
        .legendItem:hover {
          background: #F6F4EC;
        }
        .legendItemActive {
          background: #1B3A2B;
          color: white;
        }
        .legendDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .legendCount {
          margin-left: auto;
          font-size: 11px;
          color: #999;
        }
        .legendItemActive .legendCount {
          color: #CBD4C8;
        }
        .moreFilters {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .moreFilters label {
          font-size: 10px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .moreFilters select {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .resetBtn {
          margin-top: 6px;
          background: none;
          border: 1px solid #ddd;
          color: #1B3A2B;
          font-size: 12px;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .resetBtn:hover {
          background: #F6F4EC;
        }
        .listPane {
          min-width: 0;
        }
        .searchInput {
          width: 100%;
          padding: 11px 14px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 14px;
          margin-bottom: 8px;
          font-family: 'IBM Plex Sans', sans-serif;
          box-sizing: border-box;
        }
        .listMeta {
          font-size: 12px;
          color: #999;
          margin-bottom: 16px;
        }
        .eventCard {
          display: flex;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(27, 58, 43, 0.08);
          margin-bottom: 14px;
          opacity: 0;
          transform: translateY(10px);
          animation: cardIn 0.5s ease forwards;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .eventCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(27, 58, 43, 0.15);
        }
        @keyframes cardIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .eventBar {
          width: 6px;
          flex-shrink: 0;
        }
        .eventContent {
          flex: 1;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .eventLeft {
          flex: 1;
          min-width: 180px;
        }
        .eventFieldTag {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          margin-bottom: 6px;
        }
        .eventTitle {
          font-weight: 600;
          color: #1B3A2B;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .eventLocation {
          font-size: 12px;
          color: #777;
          margin-bottom: 6px;
        }
        .eventStatus {
          font-size: 12px;
        }
        .countdown {
          color: #C79A3E;
          font-weight: 600;
        }
        .full {
          color: #999;
          font-weight: 600;
        }
        .past {
          color: #bbb;
        }
        .eventRight {
          text-align: center;
          min-width: 84px;
        }
        .eventDay {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }
        .eventMon {
          font-size: 10px;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .eventRegisterBtn {
          background: #1B3A2B;
          color: #F6F4EC;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease;
        }
        .eventRegisterBtn:not(:disabled):hover {
          background: #2A5040;
        }
        .eventRegisterBtn:disabled {
          background: #eee;
          color: #aaa;
          cursor: not-allowed;
        }
        .empty {
          text-align: center;
          color: #999;
          padding: 40px 0;
        }
      `}</style>
    </div>
  )
}