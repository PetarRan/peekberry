import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
} from "@clerk/clerk-react";
  import Dashboard from "./pages/Dashboard";
  
  export default function App() {
    console.log("App");
    return (
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
    );
  }