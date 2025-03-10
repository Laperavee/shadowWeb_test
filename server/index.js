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
app.use(cors());
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

// Endpoint pour récupérer les tokens
app.get('/api/tokens', async (req, res) => {
    try {
        const { network } = req.query;
        
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('network', network)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tokens:', error);
            return res.status(500).json({ error: error.message });
        }

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
            token_image,
            tx_hash
        } = req.body;

        if (!tx_hash) {
            return res.status(400).json({ error: 'Transaction hash is required' });
        }

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
                image_url: token_image
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 