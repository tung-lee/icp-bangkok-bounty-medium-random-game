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
      <header className="bg-blue-950/50 shadow-lg backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            🎲 Lucky Draw Game 🎲
          </h1>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all flex items-center gap-2"
            >
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11 4.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L11.586 7H6a1 1 0 1 1 0-2h5.586L8.293 1.707a1 1 0 0 1 1.414-1.414L14 4.586v2.828z" clipRule="evenodd" />
              </svg>
            </button>
          )}
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
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Welcome to Lucky Draw Game!</h2>
              <p className="mb-8 text-white/80">Login with Internet Identity to start playing and tracking your wins!</p>
              <button
                onClick={login}
                className="w-full px-8 py-4 bg-yellow-400 text-blue-900 text-lg font-semibold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z" clipRule="evenodd" />
                </svg>
                Login with Internet Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;