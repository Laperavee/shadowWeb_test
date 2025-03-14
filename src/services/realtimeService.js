import { supabase } from '../utils/supabase';

class RealtimeService {
  constructor() {
    this.channels = {};
    this.listeners = {};
  }

  // Subscribe to token table changes
  subscribeToTokens(network, callback) {
    const channelId = `tokens-${network}`;
    
    if (this.channels[channelId]) {
      this.unsubscribeFromTokens(network);
    }

    this.channels[channelId] = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tokens',
          filter: `network=eq.${network}`
        }, 
        (payload) => {
          if (callback && typeof callback === 'function') {
            callback(payload);
          }
        }
      )
      .subscribe();

    this.listeners[channelId] = callback;
    
    return () => this.unsubscribeFromTokens(network);
  }

  // Subscribe to top holder purchases for a specific token
  subscribeToTokenPurchases(tokenAddress, callback) {
    const channelId = `token-purchases-${tokenAddress}`;
    
    if (this.channels[channelId]) {
      this.unsubscribeFromTokenPurchases(tokenAddress);
    }

    try {
      this.channels[channelId] = supabase
        .channel(channelId)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'token_purchases',
            filter: `token_address=eq.${tokenAddress}`
          }, 
          (payload) => {
            if (callback && typeof callback === 'function') {
              const formattedPurchase = this.formatPurchase(payload.new);
              callback({
                ...payload,
                new: formattedPurchase,
                eventType: 'INSERT'
              });
            }
          }
        )
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'token_purchases',
            filter: `token_address=eq.${tokenAddress}`
          }, 
          (payload) => {
            if (callback && typeof callback === 'function') {
              const formattedPurchase = this.formatPurchase(payload.new);
              callback({
                ...payload,
                new: formattedPurchase,
                eventType: 'UPDATE'
              });
            }
          }
        )
        .subscribe();

      this.listeners[channelId] = callback;
      
      return () => this.unsubscribeFromTokenPurchases(tokenAddress);
    } catch (error) {
      console.error(`[RealtimeService] Failed to create channel ${channelId}:`, error);
      return () => {};
    }
  }

  // Format purchase data to match tokenService format
  formatPurchase(tx) {
    const date = new Date(tx.created_at);
    const formattedDate = !isNaN(date.getTime()) 
      ? date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Unknown date';

    return {
      action: tx.action ? 'BUY' : 'SELL',
      amount: tx.amount ? (parseFloat(tx.amount) / 1e18).toFixed(3) : '0',
      cost: tx.cost ? `$${parseFloat(tx.cost).toFixed(3)}` : '$0.00',
      date: formattedDate,
      tx_hash: tx.tx_hash,
      user_id: tx.user_id
    };
  }

  // Unsubscribe from token table changes
  unsubscribeFromTokens(network) {
    const channelId = `tokens-${network}`;
    
    if (this.channels[channelId]) {
      supabase.removeChannel(this.channels[channelId]);
      delete this.channels[channelId];
      delete this.listeners[channelId];
    }
  }

  // Unsubscribe from token purchases
  unsubscribeFromTokenPurchases(tokenAddress) {
    const channelId = `token-purchases-${tokenAddress}`;
    
    if (this.channels[channelId]) {
      supabase.removeChannel(this.channels[channelId]);
      delete this.channels[channelId];
      delete this.listeners[channelId];
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    Object.keys(this.channels).forEach(channelId => {
      supabase.removeChannel(this.channels[channelId]);
    });
    
    this.channels = {};
    this.listeners = {};
  }
}

export const realtimeService = new RealtimeService(); 