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
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE');
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
      process.env.SUPABASE_SERVICE_ROLE
    );

    // Extract token address from path
    const path = event.path;
    const tokenAddress = path.split('/getTokenPurchases/')[1];

    console.log(`[TokenPurchases] Processing request for token: ${tokenAddress}`);
    
    if (!tokenAddress) {
      console.error('[TokenPurchases] No token address provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    console.log(`[TokenPurchases] Fetching purchases for token: ${tokenAddress}`);
    
    // Get purchases with additional fields
    const { data, error } = await supabase
      .from('token_purchases')
      .select('*')
      .eq('token_address', tokenAddress)
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[TokenPurchases] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
        })
      };
    }


    console.log(`[TokenPurchases] Found ${formattedData.length} purchases for token ${tokenAddress}`);
    if (formattedData.length > 0) {
      console.log('[TokenPurchases] Sample purchase:', formattedData[0]);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data
      })
    };
  } catch (error) {
    console.error('[TokenPurchases] Server error:', error);
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