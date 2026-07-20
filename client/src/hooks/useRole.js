// useRole() used to open its own onAuthStateChanged subscription and
// call getUserRole() independently, which meant every component using
// this hook (Navbar, Dashboard, ...) duplicated the same Firestore read
// on every auth event. Role is now owned by a single RoleProvider
// (see src/context/RoleContext.jsx) — this file just re-exports the
// context-backed hook so every existing `import useRole from
// "../hooks/useRole"` keeps working unchanged.
export { default, useRoleState } from "../context/RoleContext";