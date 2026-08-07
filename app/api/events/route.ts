import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, event_date, location, state, field, capacity } = body

  // Check for clashes: any active event on the same date
  const { data: existing, error: checkError } = await supabase
    .from('events')
    .select('id, title')
    .eq('event_date', event_date)
    .eq('status', 'active')

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 })
  }

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { warning: `Clash detected: "${existing[0].title}" is already scheduled on this date.`, clash: true },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('events')
    .insert([{ title, event_date, location, state, field, capacity }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0], { status: 201 })
}