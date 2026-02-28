import React, { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Página "Inicio" del panel — registrada en AdminJS `pages`.
 * Redirige vía react-router al dashboard raíz (/admin) sin recargar la página.
 *
 * Registrada en setup.js:
 *   Components.HomeDashboard = componentLoader.add("HomeDashboard", ...)
 *   pages: { inicio: { label: "Inicio", icon: "Home", component: Components.HomeDashboard } }
 */
const HomeDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin");
  }, [navigate]);

  return null;
};

export default HomeDashboard;
