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
                // Vérifier si la table existe et son contenu
                console.log('📊 Checking token_purchases table...');
                
                // 1. Vérifier le nombre total d'entrées dans la table
                const { data: totalCount, error: countError } = await supabase
                    .from('token_purchases')
                    .select('count', { count: 'exact' });

                console.log('Total purchases in table:', {
                    count: totalCount,
                    error: countError
                });

                if (countError) {
                    console.error('❌ Table check error:', countError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Failed to check token_purchases table',
                            details: countError
                        })
                    };
                }

                // 2. Récupérer un échantillon des dernières entrées
                const { data: sampleData, error: sampleError } = await supabase
                    .from('token_purchases')
                    .select('*')
                    .limit(5)
                    .order('created_at', { ascending: false });

                console.log('Recent purchases sample:', {
                    hasData: sampleData && sampleData.length > 0,
                    sampleSize: sampleData?.length || 0,
                    firstEntry: sampleData?.[0],
                    error: sampleError
                });

                // 3. Requête spécifique pour le token
                console.log(`📡 Fetching purchases for token: ${tokenAddress}`);
                const { data: purchases, error: purchasesError } = await supabase
                    .from('token_purchases')
                    .select('*')
                    .eq('token_address', tokenAddress.toLowerCase()) // Convertir en minuscules
                    .order('created_at', { ascending: false });

                if (purchasesError) {
                    console.error('❌ Query error:', purchasesError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Failed to fetch purchases',
                            details: purchasesError,
                            debug: {
                                tokenAddress,
                                lowercaseAddress: tokenAddress.toLowerCase()
                            }
                        })
                    };
                }

                console.log('Token-specific query results:', {
                    purchasesFound: purchases?.length || 0,
                    tokenAddress: tokenAddress,
                    lowercaseAddress: tokenAddress.toLowerCase(),
                    firstPurchase: purchases?.[0]
                });

                // Récupérer les informations du token
                const { data: token, error: tokenError } = await supabase
                    .from('tokens')
                    .select('token_symbol, token_name')
                    .eq('token_address', tokenAddress)
                    .single();

                if (tokenError) {
                    console.warn('⚠️ Token info not found:', tokenError);
                }

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