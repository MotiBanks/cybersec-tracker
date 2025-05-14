import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId, content, tags = [] } = await request.json()
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and content are required' },
        { status: 400 }
      )
    }

    // Get service client with admin privileges to bypass RLS
    const supabase = getServiceClient()
    
    // Direct insert to avoid the ambiguous column issue
    const { data, error } = await supabase
      .from('reflections')
      .insert({
        user_id: userId,
        content: content.trim(),
        tags: tags || []
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving reflection:', error)
      return NextResponse.json(
        { error: `Failed to save reflection: ${error.message}` },
        { status: 500 }
      )
    }

    // Manually update user streak and XP in separate queries
    // This avoids the ambiguous column reference issue
    await supabase.rpc('manual_update_user_streak', { 
      user_id_param: userId 
    })
    
    await supabase.rpc('manual_add_user_xp', { 
      user_id_param: userId,
      xp_amount: 15,
      source_type: 'reflection',
      source_id_param: data.id
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in reflection API:', error)
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}
