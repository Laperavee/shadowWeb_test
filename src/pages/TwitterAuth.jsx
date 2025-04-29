import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TwitterAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const response = await fetch('/.netlify/functions/check-auth');
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        if (data.authenticated) {
          navigate('/shadow-fun');
        }
      } catch (error) {
        console.error('Error during authentication:', error);
        navigate('/shadow-fun');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-fuchsia-500 mx-auto mb-8"></div>
        <h2 className="text-2xl font-bold text-white mb-4">Connecting to Twitter...</h2>
        <p className="text-gray-400">Please wait while we authenticate your Twitter account.</p>
      </div>
    </div>
  );
} 