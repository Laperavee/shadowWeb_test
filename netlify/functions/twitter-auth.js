const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${event.headers.origin}/auth/callback`,
        skipBrowserRedirect: true
      }
    })

    if (error) {
      console.error('Twitter auth error:', error)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ url: data.url })
    }
  } catch (error) {
    console.error('Twitter auth error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
} 