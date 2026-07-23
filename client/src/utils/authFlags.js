// Shared signal so active Firestore listeners can distinguish a
// permission-denied error caused by an in-progress sign-out (expected,
// harmless) from a genuine rules/auth problem (should still be logged).
export const authFlags = {
  loggingOut: false,
};