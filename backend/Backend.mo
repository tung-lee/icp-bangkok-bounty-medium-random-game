import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

actor class Backend() {
  // Import required dependencies
  let SubnetManager : actor {
    raw_rand() : async Blob;
  } = actor "aaaaa-aa";

  // Store player stats
  private type PlayerStats = {
    totalPlays: Nat;
    wins: Nat;
    lastPlayed: Int;
  };

  private let players = HashMap.HashMap<Principal, PlayerStats>(10, Principal.equal, Principal.hash);

  // Convert blob to nat for determining win/lose
  private func blobToNat(b : Blob) : Nat {
    let bytes = Blob.toArray(b);
    if (bytes.size() == 0) return 0;
    Nat8.toNat(bytes[0]);
  };

  // Enter the lucky draw
  public shared(msg) func playLuckyDraw() : async Text {
    let caller = msg.caller;
    
    // Ensure caller is authenticated
    if (Principal.isAnonymous(caller)) {
      return "Please login to play!";
    };

    // Update player stats
    let currentStats = switch (players.get(caller)) {
      case null {
        // New player
        {
          totalPlays = 0;
          wins = 0;
          lastPlayed = Time.now();
        }
      };
      case (?stats) { stats };
    };

    // Get random bytes
    let randomBytes = await SubnetManager.raw_rand();
    let randomNum = blobToNat(randomBytes);
    
    // 10% chance to win (if random number is less than 26)
    let isWinner = randomNum < 26;
    
    // Update and store player stats
    let newStats = {
      totalPlays = currentStats.totalPlays + 1;
      wins = currentStats.wins + (if isWinner { 1 } else { 0 });
      lastPlayed = Time.now();
    };
    players.put(caller, newStats);

    // Return result with stats
    if (isWinner) {
      return "🎉 Congratulations! You won! (Wins: " 
        # Nat.toText(newStats.wins) 
        # "/" 
        # Nat.toText(newStats.totalPlays) 
        # ")";
    } else {
      return "Try again! 🍀 (Wins: " 
        # Nat.toText(newStats.wins) 
        # "/" 
        # Nat.toText(newStats.totalPlays) 
        # ")";
    };
  };

  // Get player stats
  public query(msg) func getPlayerStats() : async ?PlayerStats {
    players.get(msg.caller);
  };
};