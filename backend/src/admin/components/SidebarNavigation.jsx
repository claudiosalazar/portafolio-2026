import React, { useMemo } from "react";
import { Navigation } from "@adminjs/design-system";
import {
  useNavigationResources,
  useTranslation,
} from "adminjs";
import { useLocation, useNavigate } from "react-router";

/**
 * Overrides AdminJS's SidebarResourceSection to inject the "Inicio"
 * dashboard link as the very first item under "Panel de Control".
 */
const SidebarNavigation = ({ resources }) => {
  const elements = useNavigationResources(resources);
  const { translateLabel } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const rootPath = "/admin";
  const isHomeSelected = location.pathname === rootPath || location.pathname === rootPath + "/";

  const homeElement = useMemo(() => ({
    id: "__dashboard__",
    label: "Inicio",
    icon: "Home",
    href: rootPath,
    isSelected: isHomeSelected,
    onClick: (event) => {
      event.preventDefault();
      navigate(rootPath);
    },
  }), [isHomeSelected, navigate]);

  const allElements = [homeElement, ...elements];

  return (
    <Navigation
      label={translateLabel("navigation")}
      elements={allElements}
    />
  );
};

export default SidebarNavigation;
