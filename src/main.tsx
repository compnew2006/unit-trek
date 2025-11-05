import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress Chrome Extension message passing errors
// These errors occur when browser extensions try to communicate with the page
// but the message channel closes before receiving a response
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    
    // Ignore Chrome Extension message passing errors
    if (
      message.includes('message channel closed') ||
      message.includes('listener indicated an asynchronous response')
    ) {
      return; // Silently ignore these errors
    }
    
    // Call original console.error for other errors
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
