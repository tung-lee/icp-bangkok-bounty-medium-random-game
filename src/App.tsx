import './App.css';
import { useQueryCall, useUpdateCall } from '@ic-reactor/react';
import { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";

function App() {
  const [result, setResult] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { data: playerStats, call: refetchStats } = useQueryCall({
    functionName: 'getPlayerStats',
  });

  const { call: playLuckyDraw, loading: playLoading, error } = useUpdateCall({
    functionName: 'playLuckyDraw',
    onSuccess: (response: unknown) => {
      setResult(response as string);
      refetchStats();
    },
  });

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);
    const isAuthed = await client.isAuthenticated();
    setIsAuthenticated(isAuthed);
  };

  const login = async () => {
    if (!authClient) return;
  
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: () => {
          setIsAuthenticated(true);
          resolve(null);
        },
        onError: reject,
      });
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
  };

  const handlePlayLuckyDraw = () => {
    setIsPlaying(true);
    playLuckyDraw();
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-blue-700 flex flex-col">
      <header className="bg-blue-950/50 shadow-lg backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            🎲 Lucky Draw Game 🎲
          </h1>
          <button
            onClick={isAuthenticated ? logout : login}
            className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg hover:bg-yellow-300 transition-all"
          >
            {isAuthenticated ? 'Logout' : 'Login'}
          </button>
        </div>
      </header>

      {isAuthenticated ? (
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">Your Stats</h2>
                <div className="text-4xl font-bold text-yellow-400">
                  {/* @ts-ignore */}
                  {playerStats ? `${playerStats.wins}/${playerStats.totalPlays}` : 'Loading...'} 
                  <span className="text-xl ml-2 text-yellow-300">wins</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 mb-8">
              <div className="flex flex-col items-center gap-8">
                <div className={`w-48 h-48 relative ${isPlaying ? 'animate-pulse' : ''}`}>
                  <div className="absolute inset-0 rounded-full bg-yellow-400 shadow-lg flex items-center justify-center">
                    <span className="text-4xl">🎲</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlayLuckyDraw}
                  disabled={playLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-yellow-400 text-blue-900 text-lg font-semibold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 disabled:bg-yellow-400/50 disabled:transform-none shadow-md"
                >
                  {playLoading ? 'Playing...' : 'Try Your Luck!'}
                </button>

                {result && !isPlaying && (
                  <div className={`text-center p-4 rounded-lg w-full ${
                    result.includes('Congratulations') ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'
                  }`}>
                    <p className="text-xl font-semibold">{result}</p>
                  </div>
                )}

                {error && (
                  <div className="text-center p-4 bg-red-400/20 rounded-lg w-full">
                    <p className="text-red-300 font-medium">{error.toString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-white mb-4">How to Play</h2>
              <ul className="space-y-2 text-white/80 list-none">
                <li>Click "Try Your Luck!" to play</li>
                <li>You have a 10% chance to win</li>
                <li>Your stats will be tracked</li>
                <li>Good luck! 🍀</li>
              </ul>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Welcome to Lucky Draw Game!</h2>
            <p className="mb-8">Please login with Internet Identity to play.</p>
            <button
              onClick={login}
              className="px-8 py-3 bg-yellow-400 text-blue-900 text-lg font-semibold rounded-lg hover:bg-yellow-300 transition-all"
            >
              Login to Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;