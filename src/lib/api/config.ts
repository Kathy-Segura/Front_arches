// Rutas de las que consume datos del back en el front
const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:8081"
  : "https://back-arches.onrender.com";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");