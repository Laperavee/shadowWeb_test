const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('[AddToken] Missing required environment variables');
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
    // Parse the request body
    const tokenData = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = ['token_address', 'network'];
    const missingFields = requiredFields.filter(field => !tokenData[field]);
    
    if (missingFields.length > 0) {
      console.error('[AddToken] Missing required fields:', missingFields);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        })
      };
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    console.log(`[AddToken] Adding token: ${tokenData.token_address} on network: ${tokenData.network}`);

    // Prepare the token data with default values
    const tokenToInsert = {
      token_address: tokenData.token_address,
      created_at: tokenData.created_at || new Date().toISOString(),
      liquidity: tokenData.liquidity || 0,
      supply: tokenData.supply || 0,
      network: tokenData.network,
      deployer_address: tokenData.deployer_address.toLowerCase() || null,
      max_wallet_percentage: tokenData.max_wallet_percentage || null,
      token_name: tokenData.token_name || null,
      token_symbol: tokenData.token_symbol || null,
      image_url: tokenData.image_url || null,
      is_featured: tokenData.is_featured || false,
      pool_address: tokenData.pool_address || null,
      twitter_handle: tokenData.twitter_handle || null,
      website_url: tokenData.website_url || null,
      is_fresh: tokenData.is_fresh || false
    };

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id')
      .eq('token_address', tokenToInsert.token_address)
      .eq('network', tokenToInsert.network)
      .single();

    let result;
    
    if (existingToken) {
      // Update existing token
      result = await supabase
        .from('tokens')
        .update(tokenToInsert)
        .eq('id', existingToken.id)
        .select()
        .single();
    } else {
      // Insert new token
      result = await supabase
        .from('tokens')
        .insert(tokenToInsert)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[AddToken] Database error:', result.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: result.error.message 
        })
      };
    }

    console.log(`[AddToken] Successfully ${existingToken ? 'updated' : 'added'} token:`, result.data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: result.data,
        debug: {
          action: existingToken ? 'updated' : 'inserted',
          token_address: tokenToInsert.token_address,
          network: tokenToInsert.network
        }
      })
    };
  } catch (error) {
    console.error('[AddToken] Server error:', error);
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