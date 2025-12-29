import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR'] as const
type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

interface FrankfurterResponse {
  base: string
  date: string
  rates: Record<string, number>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting exchange rate update...')

    // Initialize Supabase client with service role for DB access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch rates from Frankfurter API (free, no API key needed)
    // Using EUR as base since it's the ECB's reference currency
    const apiUrl = `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${SUPPORTED_CURRENCIES.join(',')}`
    console.log(`Fetching rates from: ${apiUrl}`)

    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`)
    }

    const data: FrankfurterResponse = await response.json()
    console.log('Received rates:', JSON.stringify(data.rates))

    // Calculate all currency pair combinations
    const exchangeRates: Array<{
      base_currency: SupportedCurrency
      target_currency: SupportedCurrency
      rate: number
    }> = []

    // EUR rates are direct from API
    const eurRates: Record<string, number> = {
      EUR: 1,
      ...data.rates
    }

    // Generate all pairs
    for (const base of SUPPORTED_CURRENCIES) {
      for (const target of SUPPORTED_CURRENCIES) {
        if (base === target) {
          // Same currency = 1:1
          exchangeRates.push({
            base_currency: base,
            target_currency: target,
            rate: 1
          })
        } else {
          // Calculate cross rate: base -> EUR -> target
          // rate = eurRates[target] / eurRates[base]
          const rate = eurRates[target] / eurRates[base]
          exchangeRates.push({
            base_currency: base,
            target_currency: target,
            rate: Number(rate.toFixed(6))
          })
        }
      }
    }

    console.log(`Calculated ${exchangeRates.length} exchange rate pairs`)

    // Upsert rates into database
    for (const rate of exchangeRates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(
          {
            base_currency: rate.base_currency,
            target_currency: rate.target_currency,
            rate: rate.rate,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'base_currency,target_currency'
          }
        )

      if (error) {
        console.error(`Error upserting rate ${rate.base_currency}->${rate.target_currency}:`, error)
        throw error
      }
    }

    console.log('Successfully updated all exchange rates')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Exchange rates updated successfully',
        rates: exchangeRates,
        source: 'Frankfurter API (ECB)',
        date: data.date
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update exchange rates';
    console.error('Error updating exchange rates:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
