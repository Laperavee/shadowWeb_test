const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: 'https://gaopzywnpatpifgakags.supabase.co/auth/v1/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'tweet.read users.read'
        },
        skipBrowserRedirect: true
      }
    });

    if (error) {
      console.error('Twitter auth error:', error);
      throw error;
    }

    if (!data.url) {
      throw new Error('No authentication URL returned from Supabase');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ url: data.url })
    };
  } catch (error) {
    console.error('Twitter auth error:', error);
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