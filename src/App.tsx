import './App.css';
import { useQueryCall, useUpdateCall } from '@ic-reactor/react';
import { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";

interface PlayerStats {
  totalPlays: bigint;
  wins: bigint;
  lastPlayed: bigint;
}

function App() {
  const [result, setResult] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { data: playerStats, call: refetchStats } = useQueryCall<[PlayerStats] | null>({
    // @ts-ignore
    functionName: 'getPlayerStats',
    agent: authClient?.getIdentity() ? new HttpAgent({
      identity: authClient.getIdentity(),
      host: "https://ic0.app" 
    }) : undefined,
    // @ts-ignore
    args: [],
  });

  const { call: playLuckyDraw, loading: playLoading, error } = useUpdateCall({
    functionName: 'playLuckyDraw',
    agent: authClient?.getIdentity() ? new HttpAgent({
      identity: authClient.getIdentity(),
      host: "https://ic0.app"
    }) : undefined,
    args: [],
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
    <div className="min-h-screen w-full bg-white">
      <header className="w-full glass-effect shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="dice-float">🎲</span>
            Lucky Draw
            <span className="dice-float" style={{ animationDelay: '0.5s' }}>🎲</span>
          </h1>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg"
            >
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H6a1 1 0 110-2h5.586L8.293 1.707a1 1 0 011.414-1.414L14 4.586v2.828z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {isAuthenticated ? (
        <main className="flex-1 w-full p-6 sm:p-8 lg:p-12">
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Stats</h2>
                <div className="text-5xl font-bold text-blue-600">
                  {/* @ts-ignore */}
                  {/* {playerStats ? `${Number(playerStats[0].wins)}/${Number(playerStats[0].totalPlays)}` : 'Loading...'}  */}
                  {/* <span className="text-2xl ml-3 text-yellow-500">Wins</span> */}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center gap-10">
                <div className={`w-56 h-56 relative ${isPlaying ? 'animate-spin' : 'dice-float'}`}>
                  <div className="absolute inset-0 rounded-full bg-yellow-400 shadow-lg flex items-center justify-center transform transition-all duration-500 hover:scale-110">
                    <span className="text-7xl">🎲</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlayLuckyDraw}
                  disabled={playLoading}
                  className="w-full sm:w-auto px-10 py-4 bg-blue-500 text-white text-xl font-bold rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                >
                  {playLoading ? 'Rolling the Dice...' : 'Try Your Luck! 🎲'}
                </button>

                {result && !isPlaying && (
                  <div className={`text-center p-6 rounded-xl w-full ${
                    result.includes('Congratulations') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <p className="text-xl font-semibold">{result}</p>
                  </div>
                )}

                {error && (
                  <div className="text-center p-4 bg-red-100 rounded-lg w-full">
                    <p className="text-red-700 font-medium">{error.toString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center bg-gray-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Play</h2>
              <ul className="space-y-2 text-gray-600 list-none">
                <li>Click "Try Your Luck!" to play</li>
                <li>You have a 10% chance to win</li>
                <li>Your stats will be tracked</li>
                <li>Good luck! 🍀</li>
              </ul>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 w-full">
          <div className="bg-gray-50 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Lucky Draw Game!</h2>
              <p className="mb-8 text-gray-600">Login with Internet Identity to start playing and tracking your wins!</p>
              <button
                onClick={login}
                className="w-full px-8 py-4 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
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