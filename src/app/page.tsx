import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import GameWrapper from "../../components/GameWrapper";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-gradient-to-b from-emerald-50 to-white">
      <SignedIn>
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">Snake Game</h1>
          <p className="text-gray-600 max-w-md mx-auto">Use arrow keys to control the snake and collect food! How high can you score?</p>
        </div>
        <GameWrapper />
      </SignedIn>
      
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </main>
  );
}
