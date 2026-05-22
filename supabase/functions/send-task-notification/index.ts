import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Initialize Supabase to look up the email
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // LOOK UP EMAIL from profiles table using the assignee name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('full_name', record.assignee)
      .single()

    if (profileError || !profile?.email) {
      console.log(`No email found for assignee: ${record.assignee}`)
      return new Response(JSON.stringify({ message: 'Assignee email not found' }), { status: 200 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Leap <onboarding@resend.dev>',
      to: [profile.email],
      subject: `New Task Assigned: ${record.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #6c63ff;">You have a new task! 🚀</h2>
          <p>Hi there,</p>
          <p>A new task has been assigned to you in <strong>Leap</strong>.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6c63ff;">
            <p><strong>Task:</strong> ${record.name}</p>
            <p><strong>Priority:</strong> ${record.priority || 'Medium'}</p>
            <p><strong>Status:</strong> ${record.status || 'To Do'}</p>
          </div>
          <p>Go to your dashboard to start working on it.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #999;">This is an automated notification from Leap.</p>
        </div>
      `,
    })

    if (error) throw error

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
