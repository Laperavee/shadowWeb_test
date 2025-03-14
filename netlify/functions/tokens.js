import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export const handler = async (event, context) => {
    // Gérer les requêtes OPTIONS pour CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Log environment check
        console.log('Environment check:', {
            hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.VITE_SUPABASE_SERVICE_KEY
        });

        // GET /api/tokens (liste des tokens par réseau)
        if (event.httpMethod === 'GET' && !event.path.includes('/creator/') && !event.path.includes('/address/')) {
            const params = new URLSearchParams(event.queryStringParameters);
            const network = params.get('network');
            
            console.log('Fetching tokens for network:', network);

            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .eq('network', network)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase query error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: error.message,
                        details: error
                    })
                };
            }

            console.log(`Successfully fetched ${data?.length || 0} tokens`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data })
            };
        }

        // GET /api/tokens/creator/:address (tokens par créateur)
        if (event.httpMethod === 'GET' && event.path.includes('/creator/')) {
            const creator = event.path.split('/creator/')[1];
            
            const { data, error } = await supabase
                .from('tokens')
                .select(`
                    token_address,
                    token_name,
                    token_symbol,
                    supply,
                    liquidity,
                    max_wallet_percentage,
                    network,
                    deployer_address,
                    created_at
                `)
                .eq('deployer_address', creator)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data })
            };
        }

        // GET /api/tokens/address/:address (token par adresse)
        if (event.httpMethod === 'GET' && event.path.includes('/address/')) {
            const address = event.path.split('/address/')[1];
            
            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .eq('token_address', address)
                .single();

            if (error) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Token not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data })
            };
        }

        // GET /api/tokens/:tokenAddress/top-holder-purchases (achats des top holders)
        if (event.httpMethod === 'GET' && event.path.includes('/top-holder-purchases')) {
            console.log('🔍 Handling top-holder-purchases request');
            console.log('Raw path:', event.path);
            
            // Fix path parsing to handle double 'tokens'
            const pathParts = event.path.split('/');
            const tokenIndex = pathParts.lastIndexOf('tokens') + 1;
            const tokenAddress = pathParts[tokenIndex];
            
            console.log('Path analysis:', {
                pathParts,
                tokenIndex,
                tokenAddress,
                fullPath: event.path
            });

            if (!tokenAddress || tokenAddress === 'top-holder-purchases') {
                console.error('❌ Invalid token address in path');
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Invalid token address in path' 
                    })
                };
            }

            try {
                // Vérifier si la table existe
                console.log('📊 Checking token_purchases table...');
                const { data: tableInfo, error: tableError } = await supabase
                    .from('token_purchases')
                    .select('count(*)')
                    .limit(1);

                if (tableError) {
                    console.error('❌ Table check error:', tableError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Failed to check token_purchases table',
                            details: tableError
                        })
                    };
                }

                // Requête pour ce token spécifique
                console.log(`📡 Fetching purchases for token: ${tokenAddress}`);
                const { data: purchases, error: purchasesError } = await supabase
                    .from('token_purchases')
                    .select('*')
                    .eq('token_address', tokenAddress)
                    .order('created_at', { ascending: false });

                if (purchasesError) {
                    console.error('❌ Query error:', purchasesError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Failed to fetch purchases',
                            details: purchasesError
                        })
                    };
                }

                // Récupérer les informations du token
                const { data: token, error: tokenError } = await supabase
                    .from('tokens')
                    .select('token_symbol, token_name')
                    .eq('token_address', tokenAddress)
                    .single();

                if (tokenError) {
                    console.warn('⚠️ Token info not found:', tokenError);
                }

                console.log('Query results:', {
                    purchasesFound: purchases?.length || 0,
                    hasTokenInfo: !!token,
                    tokenSymbol: token?.token_symbol,
                    tokenName: token?.token_name
                });

                const formattedPurchases = (purchases || []).map(p => ({
                    type: p.action ? 'BUY' : 'SELL',
                    amount: p.amount ? (parseFloat(p.amount) / 1e18).toLocaleString() : '0',
                    price: p.cost ? `$${parseFloat(p.cost).toFixed(2)}` : '$0.00',
                    timestamp: p.created_at,
                    txHash: p.tx_hash,
                    user: p.user_id,
                    tokenSymbol: token?.token_symbol || 'UNKNOWN',
                    tokenName: token?.token_name || 'Unknown Token'
                }));

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: formattedPurchases,
                        debug: {
                            tokenAddress,
                            purchasesCount: purchases?.length || 0,
                            hasTokenInfo: !!token
                        }
                    })
                };
            } catch (error) {
                console.error('❌ Handler error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Internal server error',
                        details: error.message,
                        debug: { tokenAddress }
                    })
                };
            }
        }

        // POST /api/tokens (création de token)
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const {
                token_address,
                token_name,
                token_symbol,
                supply,
                liquidity,
                max_wallet_percentage,
                network,
                deployer_address,
                image_url,
                is_featured
            } = body;

            const { data, error } = await supabase
                .from('tokens')
                .insert([{
                    token_address,
                    token_name,
                    token_symbol,
                    supply,
                    liquidity,
                    max_wallet_percentage,
                    network,
                    deployer_address,
                    created_at: new Date(),
                    image_url,
                    is_featured: is_featured || false
                }])
                .select();

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 