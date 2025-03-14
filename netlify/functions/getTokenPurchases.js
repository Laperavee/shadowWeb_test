const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  const tokenAddress = event.queryStringParameters.tokenAddress;
  const { data, error } = await supabase
    .from('token_purchases')
    .select('*')
    .eq('token_address', tokenAddress);

  if (error) {
    console.error('Error fetching token purchases:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
}; 