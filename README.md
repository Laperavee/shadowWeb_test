# Shadow Web

A modern web application for tracking and interacting with tokens created via the Shadow Protocol.

![Shadow Web](https://via.placeholder.com/1200x600/0a0a0a/ff00ff?text=Shadow+Web)

## Features

- Display tokens created via Shadow Protocol
- Detailed token information with price and liquidity data
- Real-time tracking of purchases made by top holders
- Modern and responsive user interface
- Integration with DexScreener for price charts
- Blockchain transaction monitoring

## Latest Features

### Top Holder Purchase Tracking

The application now includes a system for tracking purchases made by top holders for each token. This feature allows:

- Real-time monitoring of transactions from top holders
- Display of these purchases on each token's detail page
- Detailed information about each purchase (amount, date, transaction link)
- Visual indicators of top holder activity

## Database Structure

The application uses Supabase with the following tables:

### `tokens` Table

Stores information about tokens created via Shadow Protocol.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier |
| token_address | text | Token contract address |
| token_name | text | Token name |
| token_symbol | text | Token symbol |
| supply | text | Total token supply |
| liquidity | text | Initial liquidity |
| max_wallet_percentage | integer | Maximum percentage per wallet |
| network | text | Network (AVAX, ETH, etc.) |
| deployer_address | text | Deployer address |
| created_at | timestamp | Creation date |
| image_url | text | Token image URL |
| is_featured | boolean | Featured token flag |
| tx_hash | text | Creation transaction hash |

### `top_holders` Table

Stores information about tracked top holders.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier |
| address | text | Holder address (Primary Key) |
| name | text | Holder name or pseudonym |
| profile_url | text | Profile image URL |

### `token_purchases` Table

Records purchases made by top holders.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier |
| holder_address | text | Top holder address (Foreign Key to top_holders.address) |
| token_address | text | Purchased token address |
| tx_hash | text | Purchase transaction hash |
| amount | text | Amount purchased |
| purchased_at | timestamp | Purchase date |


## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Access to a WebSocket RPC endpoint for the blockchain network

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
WEBSOCKET_RPC_URL=your_websocket_rpc_url
```

> **Note**: The `WEBSOCKET_RPC_URL` is required for the token tracker to function. This should be a WebSocket URL for the blockchain network you're monitoring (e.g., `wss://api.avax.network/ext/bc/C/ws` for Avalanche C-Chain).

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shadow-web.git
cd shadow-web

# Install dependencies
npm install

# Start the development server
npm run dev

# Start the backend server
npm run server
```

## Token Tracker Functionality

The token tracker (`tokenTracker.js`) is a script that:

1. Connects to a blockchain node via WebSocket
2. Retrieves the list of top holders and tokens from the database
3. Listens for transactions in real-time
4. Detects purchases made by top holders
5. Records these purchases in the database

The tracker automatically starts when the backend server starts and includes self-healing functionality to restart if it crashes.

### Troubleshooting the Token Tracker

If you encounter issues with the token tracker:

1. Ensure the `WEBSOCKET_RPC_URL` environment variable is set correctly in your `.env` file
2. Verify that your Supabase database has the proper foreign key relationship between `token_purchases.holder_address` and `top_holders.address`
3. Check the server logs for specific error messages
4. Make sure your WebSocket RPC endpoint is accessible and not blocked by firewalls

## Database Setup

### Setting Up Foreign Key Relationships

To properly set up the foreign key relationship in Supabase:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to establish the relationship:

```sql
-- Make sure top_holders.address is unique
ALTER TABLE top_holders ADD CONSTRAINT top_holders_address_key UNIQUE (address);

-- Add foreign key constraint to token_purchases
ALTER TABLE token_purchases 
ADD CONSTRAINT token_purchases_holder_address_fkey 
FOREIGN KEY (holder_address) REFERENCES top_holders(address);
```

## Project Structure

```
/
├── server/                # Backend server code
│   ├── index.js           # Server entry point
│   └── tokenTracker.js    # Transaction monitoring script
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/             # Application pages
│   │   ├── ShadowFun.jsx  # Main token listing page
│   │   └── TokenDetail.jsx # Token detail page
│   ├── services/          # API and business logic services
│   │   ├── tokenService.js # Token-related API calls
│   │   ├── priceService.js # Price data service
│   │   └── blockchainService.js # Blockchain interaction
│   └── utils/             # Utility functions and helpers
└── .env                   # Environment variables
```

## API Endpoints

The backend server provides the following API endpoints:

- `GET /api/tokens?network=NETWORK` - Get all tokens for a specific network
- `GET /api/tokens/address/:address` - Get a specific token by address
- `GET /api/tokens/creator/:address` - Get all tokens created by a specific address
- `GET /api/tokens/:address/top-holder-purchases` - Get top holder purchases for a specific token
- `POST /api/tokens` - Create a new token

## Deployment

The application is configured to be deployed on Netlify with serverless functions.

```bash
# Build the application for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Supabase](https://supabase.io/) for the database and authentication
- [DexScreener](https://dexscreener.com/) for price charts
- [ethers.js](https://docs.ethers.io/) for blockchain interaction 