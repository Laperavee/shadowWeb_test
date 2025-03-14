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
    console.error('[TokenByAddress] Missing required environment variables');
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
    const tokenAddress = path.split('/getTokenByAddress/')[1];

    console.log(`[TokenByAddress] Processing request for token: ${tokenAddress}`);
    
    if (!tokenAddress) {
      console.error('[TokenByAddress] No token address provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    console.log(`[TokenByAddress] Fetching token data for: ${tokenAddress}`);
    
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_address', tokenAddress.toLowerCase())
      .single();

    if (error) {
      console.error('[TokenByAddress] Database error:', error);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token not found',
          details: error.message
        })
      };
    }

    console.log(`[TokenByAddress] Found token data:`, data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('[TokenByAddress] Server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
}; 