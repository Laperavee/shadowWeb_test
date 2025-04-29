const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Vérifier la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No active session' })
      };
    }

    // Récupérer le token d'accès
    const { access_token } = session.provider_token;

    // Appeler l'API Twitter v2
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Twitter user data');
    }

    const userData = await response.json();
    const twitterHandle = userData.data?.username;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ twitterHandle })
    };
  } catch (error) {
    console.error('Error getting Twitter user:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}; 