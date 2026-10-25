// TEMP: while the backend isn't ready, set VITE_USE_MOCKS=true in .env.local and the API files
// answer from src/mocks/ instead of calling the backend. Delete this file together with src/mocks/.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
