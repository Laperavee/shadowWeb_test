const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer le code d'authentification de l'URL
    const code = event.queryStringParameters.code

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No code provided' })
      }
    }

    // Échanger le code contre une session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      }
    }

    // Rediriger vers la page d'origine avec un token de succès
    return {
      statusCode: 302,
      headers: {
        Location: `${event.headers.origin}/?auth=success`
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
} 