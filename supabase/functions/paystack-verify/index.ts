import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: corsHeaders })

  try {
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!secretKey) {
      return Response.json({ ok: false, error: 'Paystack secret key is not configured.' }, { status: 500, headers: corsHeaders })
    }

    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    if (!url || !anonKey) {
      return Response.json({ ok: false, error: 'Supabase configuration is incomplete.' }, { status: 500, headers: corsHeaders })
    }

    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401, headers: corsHeaders })
    }

    const { reference, amount } = await req.json() as { reference?: string; amount?: number }
    if (!reference) {
      return Response.json({ ok: false, error: 'Payment reference is required.' }, { status: 400, headers: corsHeaders })
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const verifyPayload = await verifyResponse.json() as {
      status?: boolean;
      data?: {
        status?: string;
        amount?: number;
        reference?: string;
        paid_at?: string;
      };
      message?: string;
    }

    if (!verifyResponse.ok || !verifyPayload.status || verifyPayload.data?.status !== 'success') {
      return Response.json({ ok: false, error: verifyPayload.message ?? 'Payment verification failed.' }, { status: 400, headers: corsHeaders })
    }

    const paidAmount = Number(verifyPayload.data?.amount ?? 0)
    const expectedAmount = Number(amount ?? 0)
    if (expectedAmount > 0 && paidAmount !== expectedAmount) {
      return Response.json({ ok: false, error: 'Payment amount does not match the order total.' }, { status: 400, headers: corsHeaders })
    }

    return Response.json({ ok: true, verified: true, reference: verifyPayload.data?.reference ?? reference }, { headers: corsHeaders })
  } catch (error) {
    console.error('Paystack verification error', error)
    return Response.json({ ok: false, error: 'Payment verification failed.' }, { status: 500, headers: corsHeaders })
  }
})
