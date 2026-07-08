/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WebAuthn Helper Module for standalone biometric authentication
 */

// Helper to convert ArrayBuffer to base64 string
function bufferToString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert base64 string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if Biometric authentication is supported by the browser/device
 */
export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && 
         !!window.PublicKeyCredential && 
         !!navigator.credentials;
}

/**
 * Get all enrolled biometric usernames on this physical device
 */
export function getEnrolledUsernames(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const savedCreds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
    return Object.keys(savedCreds);
  } catch (err) {
    console.error("Failed to read enrolled usernames", err);
    return [];
  }
}

/**
 * Checks if a specific username has enrolled biometrics on this device
 */
export function isUserEnrolled(username: string): boolean {
  if (!username) return false;
  const usernames = getEnrolledUsernames();
  return usernames.includes(username.toLowerCase());
}

/**
 * De-enroll / delete biometric credentials for a username from this device
 */
export function deEnrollUser(username: string): void {
  if (typeof window === 'undefined') return;
  try {
    const savedCreds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
    delete savedCreds[username.toLowerCase()];
    localStorage.setItem('biometric_creds', JSON.stringify(savedCreds));
  } catch (err) {
    console.error("Failed to de-enroll user", err);
  }
}

/**
 * Enrolls a device using WebAuthn credentials.create API
 */
export async function enrollBiometric(username: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricSupported()) {
    return { success: false, error: "Biometric authentication is not supported on this device/browser." };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Create a deterministic but secure user ID based on username
    const userId = new TextEncoder().encode(username.toLowerCase());

    const rpId = window.location.hostname || 'localhost';

    const options: CredentialCreationOptions = {
      publicKey: {
        challenge: challenge,
        rp: {
          name: "Scents & Souls Perfume Lab",
          id: rpId,
        },
        user: {
          id: userId,
          name: username.toLowerCase(),
          displayName: displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256 (ECDSA with SHA-256)
          { type: "public-key", alg: -257 }, // RS256 (RSA with SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // platform authenticator (TouchID, FaceID, Windows Hello)
          userVerification: "required",       // enforce biometric/device PIN
        },
        timeout: 60000,
        attestation: "none",
      }
    };

    const credential = await navigator.credentials.create(options) as PublicKeyCredential;
    
    if (!credential) {
      return { success: false, error: "Failed to create credential." };
    }

    const rawIdStr = bufferToString(credential.rawId);
    
    const savedCreds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
    savedCreds[username.toLowerCase()] = {
      id: credential.id,
      rawId: rawIdStr,
      displayName: displayName,
      enrolledAt: new Date().toISOString(),
    };
    
    localStorage.setItem('biometric_creds', JSON.stringify(savedCreds));
    return { success: true };

  } catch (err: any) {
    console.error("Enrollment error details:", err);
    let errorMsg = err.message || "Unknown error during credential enrollment.";
    if (err.name === 'NotAllowedError') {
      errorMsg = "Authentication prompt was cancelled or rejected by user.";
    } else if (err.name === 'SecurityError') {
      errorMsg = "WebAuthn requires HTTPS/localhost or secure context and cannot be used in a restricted sandbox or cross-origin iframe.";
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Authenticates the user using WebAuthn credentials.get API
 */
export async function authenticateBiometric(username: string): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricSupported()) {
    return { success: false, error: "Biometric authentication is not supported on this device/browser." };
  }

  const normalizedUsername = username.toLowerCase();
  const savedCreds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
  const userCred = savedCreds[normalizedUsername];

  if (!userCred) {
    return { success: false, error: `No enrolled biometric profile found for "${username}" on this device.` };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rawId = stringToBuffer(userCred.rawId);

    const options: CredentialRequestOptions = {
      publicKey: {
        challenge: challenge,
        allowCredentials: [
          {
            type: "public-key",
            id: rawId,
          }
        ],
        userVerification: "required",
        timeout: 60000,
      }
    };

    const assertion = await navigator.credentials.get(options);
    
    if (!assertion) {
      return { success: false, error: "Biometric verification failed." };
    }

    return { success: true };

  } catch (err: any) {
    console.error("Authentication error details:", err);
    let errorMsg = err.message || "Unknown error during biometric verification.";
    if (err.name === 'NotAllowedError') {
      errorMsg = "Biometric check was cancelled or failed.";
    } else if (err.name === 'SecurityError') {
      errorMsg = "Biometric check blocked by security context (must be secure domain and allow credentials).";
    }
    return { success: false, error: errorMsg };
  }
}
