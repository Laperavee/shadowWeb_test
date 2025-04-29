const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${event.headers.origin}/auth/callback`
      }
    })

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.url })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
} 