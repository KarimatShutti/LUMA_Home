import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]!))
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
    const domain = Deno.env.get('MAILGUN_DOMAIN')
    const from = Deno.env.get('MAILGUN_FROM_EMAIL')
    if (!url || !anonKey || !mailgunKey || !domain || !from) throw new Error('Order email configuration is incomplete')
    const authorization = req.headers.get('Authorization')
    if (!authorization) return Response.json({ error: 'Sign in required' }, { status: 401, headers: corsHeaders })
    const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return Response.json({ error: 'Sign in required' }, { status: 401, headers: corsHeaders })
    const { order_id } = await req.json() as { order_id?: string }
    if (!order_id) return Response.json({ error: 'Order not found' }, { status: 400, headers: corsHeaders })
    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', order_id).maybeSingle()
    if (orderError || !order || order.user_id !== authData.user.id) return Response.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders })
    const { data: items, error: itemsError } = await supabase.from('order_items').select('product_name,quantity,unit_price,subtotal').eq('order_id', order_id)
    if (itemsError) throw itemsError
    const itemText = (items ?? []).map(item => `• ${item.product_name} × ${item.quantity} — ${money(Number(item.subtotal))}`).join('\n')
    const itemHtml = (items ?? []).map(item => `<tr><td style="padding:12px 0;border-bottom:1px solid #e9e5dc">${escapeHtml(item.product_name)} <span style="color:#777">× ${item.quantity}</span></td><td style="padding:12px 0;border-bottom:1px solid #e9e5dc;text-align:right">${money(Number(item.subtotal))}</td></tr>`).join('')
    const name = escapeHtml(order.customer_name)
    const address = `${escapeHtml(order.delivery_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)}, ${escapeHtml(order.country)}`
    const subject = 'Your LUMA HOME order has been confirmed ✨'
    const text = `Hello ${order.customer_name},\n\nThank you for shopping with LUMA HOME. Your order ${order.order_number} has been received and is being prepared.\n\n${itemText}\n\nSubtotal: ${money(Number(order.subtotal))}\nDelivery: ${Number(order.delivery_fee) === 0 ? 'Complimentary' : money(Number(order.delivery_fee))}\nTotal: ${money(Number(order.total))}\n\nDelivering to: ${address}\n\nSimple pieces. Beautiful spaces.\nLUMA HOME`
    const html = `<!doctype html><html><body style="margin:0;background:#faf9f6;color:#333;font-family:Arial,sans-serif"><div style="max-width:620px;margin:32px auto;background:#fff;padding:40px 36px;border-radius:10px"><div style="color:#1b3d2f;font-size:14px;letter-spacing:5px;font-weight:bold">LUMA <span style="color:#c9a96a">HOME</span></div><p style="color:#9a8053;letter-spacing:2px;font-size:11px;margin-top:34px">ORDER CONFIRMED</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:32px;color:#1b3d2f">A thoughtful choice, ${name}.</h1><p style="line-height:1.7">Thank you for shopping with LUMA HOME. Your order has been received and is being prepared.</p><p style="padding:16px;background:#f5f2eb;color:#1b3d2f"><strong>Order ${escapeHtml(order.order_number)}</strong></p><table style="width:100%;border-collapse:collapse;margin:22px 0">${itemHtml}<tr><td style="padding:16px 0 5px">Subtotal</td><td style="padding:16px 0 5px;text-align:right">${money(Number(order.subtotal))}</td></tr><tr><td style="padding:5px 0">Delivery</td><td style="padding:5px 0;text-align:right">${Number(order.delivery_fee) === 0 ? 'Complimentary' : money(Number(order.delivery_fee))}</td></tr><tr><td style="padding-top:14px;font-size:18px;font-weight:bold">Total</td><td style="padding-top:14px;text-align:right;font-size:18px;font-weight:bold">${money(Number(order.total))}</td></tr></table><h3 style="font-size:14px;color:#1b3d2f">Delivering to</h3><p style="line-height:1.7">${address}</p><div style="border-top:1px solid #e9e5dc;margin-top:30px;padding-top:20px;color:#53685d;font-family:Georgia,serif;font-style:italic">Simple pieces. Beautiful spaces.</div></div></body></html>`
    const form = new FormData()
    form.set('from', from); form.set('to', order.customer_email); form.set('subject', subject); form.set('text', text); form.set('html', html)
    const response = await fetch(`https://api.mailgun.net/v3/${encodeURIComponent(domain)}/messages`, {
      method: 'POST', headers: { Authorization: `Basic ${btoa(`api:${mailgunKey}`)}` }, body: form,
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('Mailgun delivery failed', response.status, detail)
      return Response.json({ error: 'Order saved, but the confirmation email could not be sent.' }, { status: 502, headers: corsHeaders })
    }
    return Response.json({ sent: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Order confirmation function failed', error)
    return Response.json({ error: 'We could not send the order confirmation.' }, { status: 500, headers: corsHeaders })
  }
})
