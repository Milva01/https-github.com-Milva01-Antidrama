import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
// Import firebase-applet-config directly from the workspace root
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore (utilizing the specific firestoreDatabaseId if configured)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initialization
export async function validateFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt a live fetch from server on a test document
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection established successfully.");
    return true;
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    
    // A 'permission-denied' response proves that the client successfully reached the Firestore server,
    // and the server responded to enforce our strict firestore.rules security boundaries.
    if (
      errorCode === 'permission-denied' || 
      errorMsg.includes('permission-denied') || 
      errorMsg.includes('permissions') || 
      errorMsg.includes('Missing or insufficient permissions')
    ) {
      console.log("Firebase connection confirmed (secured by security rules).");
      return true;
    }

    console.warn("Firebase test connection warning:", errorMsg);
    if (errorMsg.includes("offline") || errorMsg.includes("unreachable")) {
      console.warn("Firebase appears to be offline currently. The application will operate with local state.");
    }
    return false;
  }
}

// Automatically test connection
validateFirebaseConnection();
