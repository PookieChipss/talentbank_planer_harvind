import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title, event_date, location, state, field, capacity } = body

  // Check for clashes with OTHER active events on the new date
  const { data: existing, error: checkError } = await supabase
    .from('events')
    .select('id, title')
    .eq('event_date', event_date)
    .eq('status', 'active')
    .neq('id', id)

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
    .update({ title, event_date, location, state, field, capacity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('events')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Event cancelled', event: data[0] })
}