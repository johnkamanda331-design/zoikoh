import { IncomingMessage, ServerResponse } from "http";

// Lazy load the app to catch initialization errors
let app: any = null;
let initError: Error | null = null;

async function getApp() {
  if (app) return app;
  if (initError) throw initError;

  try {
    const { default: expressApp } = await import("../artifacts/api-server/src/app.js");
    app = expressApp;
    return app;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error("Failed to initialize Express app:", initError);
    throw initError;
  }
}

// Vercel serverless handler
export default async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const expressApp = await getApp();
    
    // Remove listener to prevent "listening" errors in serverless
    expressApp.removeAllListeners?.("listening");
    
    // Call the Express app directly
    return expressApp(req, res);
  } catch (err) {
    console.error("Vercel handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        error: "Internal server error",
        code: "FUNCTION_INVOCATION_FAILED",
        message: err instanceof Error ? err.message : String(err)
      }));
    }
  }
};
