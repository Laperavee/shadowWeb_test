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