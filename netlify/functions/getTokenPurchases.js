const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server configuration error: Missing environment variables' 
      })
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Extract token address from path
    const path = event.path;
    const tokenAddress = path.split('/getTokenPurchases/')[1];

    
    if (!tokenAddress) {
      console.error('❌ [getTokenPurchases] Aucune adresse de token fournie');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    // Vérifier d'abord si des données existent pour ce token
    const { count, error: countError } = await supabase
      .from('token_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('token_address', tokenAddress);

    // Get purchases with the correct column names
    const { data: purchases, error } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('token_address', tokenAddress)
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[getTokenPurchases] Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message,
          debug: {
            query: {
              table: 'token_purchases',
              filter: `token_address=${tokenAddress}`,
              total_records: count || 0
            }
          }
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: purchases || [],
        debug: {
          raw_count: purchases?.length || 0,
          token_address: tokenAddress
        }
      })
    };
  } catch (error) {
    console.error('[getTokenPurchases] Unexpected error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
}; 