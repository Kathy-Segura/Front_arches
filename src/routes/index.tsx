import { createFileRoute, redirect } from "@tanstack/react-router";

// "/" no tiene pantalla propia: siempre manda al login.
// Si ya hay sesión, login.tsx redirige a /dashboard.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
