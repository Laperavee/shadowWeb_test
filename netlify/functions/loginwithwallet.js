const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

// Fonction utilitaire pour convertir l'adresse en checksum
const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Parse and validate request body
    let walletAddress, signature, message;
    try {
      const body = JSON.parse(event.body);
      walletAddress = body.walletAddress;
      signature = body.signature;
      message = body.message;

      console.log('Login attempt:', { 
        walletAddress, 
        hasSignature: !!signature, 
        message
      });
    } catch (e) {
      console.error('Invalid request body:', e);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      console.error('Missing required fields:', { walletAddress, hasSignature: !!signature, message });
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            walletAddress: !walletAddress ? 'Wallet address is required' : null,
            signature: !signature ? 'Signature is required' : null,
            message: !message ? 'Message is required' : null
          }
        })
      };
    }

    // Verify signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
      console.log('Recovered address:', recoveredAddress);
    } catch (error) {
      console.error('Signature verification error:', error);
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid signature',
          details: error.message 
        })
      };
    }

    // Convert addresses to checksum for comparison
    try {
      const checksumWalletAddress = toChecksumAddress(walletAddress);
      const checksumRecoveredAddress = toChecksumAddress(recoveredAddress);

      console.log('Address comparison:', {
        checksumWalletAddress,
        checksumRecoveredAddress,
        match: checksumRecoveredAddress === checksumWalletAddress
      });

      if (checksumRecoveredAddress !== checksumWalletAddress) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Signature does not match wallet address' })
        };
      }
    } catch (error) {
      console.error('Address conversion error:', error);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid wallet address format',
          details: error.message
        })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        wallet_address: walletAddress.toLowerCase(),
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        user: {
          wallet_address: walletAddress.toLowerCase(),
          role: 'user'
        }
      })
    };

  } catch (error) {
    console.error('LoginWithWallet error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to login with wallet', message: error.message })
    };
  }
}; 