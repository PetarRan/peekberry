import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
  } from "@clerk/clerk-react";
  import Dashboard from "./pages/Dashboard";
  
  export default function App() {
    console.log("App");
    return (
      <div>
        <header className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Peekberry Dashboard</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
  
        <main className="p-4">
          <SignedOut>
            <p>You are signed out.</p>
            <div className="space-x-2">
              <SignInButton />
              <SignUpButton />
            </div>
          </SignedOut>
  
          <SignedIn>
            <Dashboard />
          </SignedIn>
        </main>
      </div>
    );
  }