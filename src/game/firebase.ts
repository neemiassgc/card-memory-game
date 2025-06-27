import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const firebaseDatabase = (function getFirebaseDatabase() {
  const config = {
    databaseURL: process.env["NEXT_PUBLIC_FIREBASE_DATABASE_URL"]
  }
  const app = initializeApp(config);
  return getDatabase(app);
})();