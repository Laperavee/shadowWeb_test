import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Configuration CORS
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://your-netlify-app.netlify.app', // Remplacez par votre domaine Netlify
    ],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Vérifier que les variables d'environnement sont définies
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables:');
    console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
    console.error('VITE_SUPABASE_SERVICE_KEY:', process.env.VITE_SUPABASE_SERVICE_KEY ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_KEY
);

// Test de connexion à Supabase
const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('tokens')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        
        console.log('Supabase connection successful');
        return true;
    } catch (error) {
        console.error('Supabase connection test failed:', error);
        return false;
    }
};

// Endpoint pour récupérer les tokens
app.get('/api/tokens', async (req, res) => {
    try {
        const { network } = req.query;
        console.log('GET /api/tokens - Request received for network:', network);
        
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('network', network)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tokens:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('GET /api/tokens - Query result:', {
            dataCount: data ? data.length : 0,
            firstToken: data ? data[0] : null,
            error: error ? error.message : null
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/tokens', async (req, res) => {
    try {
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
        } = req.body;

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

        if (error) {
            console.error('Error inserting token:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await testSupabaseConnection();
}); 