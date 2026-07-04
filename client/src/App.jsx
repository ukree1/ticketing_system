import AppRoutes from "./routes/AppRoutes";
import AuthGate from "./auth/AuthGate";

export default function App() {
  return (
    <AuthGate>
      <AppRoutes />
    </AuthGate>
  );
}