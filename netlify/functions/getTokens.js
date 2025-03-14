const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  const network = event.queryStringParameters.network;
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('network', network)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tokens:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
  } catch (error) {
    console.error('Server error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}; 