import AppRoutes from "./routes/AppRoutes";
import AuthGate from "./auth/AuthGate";
import { RoleProvider } from "./context/RoleContext";

export default function App() {
  return (
    <AuthGate>
      <RoleProvider>
        <AppRoutes />
      </RoleProvider>
    </AuthGate>
  );
}