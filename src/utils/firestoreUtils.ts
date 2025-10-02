import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Utility functions for handling Firestore network connectivity
 */

export const ensureFirestoreConnection = async (): Promise<void> => {
  try {
    await enableNetwork(db);
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
    throw error;
  }
};

export const handleFirestoreError = (error: any): boolean => {
  // Check if the error is related to network connectivity
  const isNetworkError = 
    error.code === 'unavailable' || 
    error.code === 'failed-precondition' ||
    error.message?.includes('offline') ||
    error.message?.includes('network') ||
    error.message?.includes('ERR_ABORTED');
    
  return isNetworkError;
};

export const retryFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure network is enabled before each attempt
      await ensureFirestoreConnection();
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (handleFirestoreError(error) && attempt < maxRetries) {
        console.warn(`Firestore operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        
        // Try to re-enable network
        try {
          await ensureFirestoreConnection();
        } catch (networkError) {
          console.error('Failed to re-enable network:', networkError);
        }
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
};