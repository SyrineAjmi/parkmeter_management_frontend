export const ROLES = {
  GESTIONNAIRE_SYSTEME: "GESTIONNAIRE_SYSTEME",
  SUPERVISEUR: "SUPERVISEUR",
  RESPONSABLE_FINANCIER: "RESPONSABLE_FINANCIER",
  AGENT_INSTALLATION: "AGENT_INSTALLATION",
  OPERATEUR: "OPERATEUR",
};

export const ROLE_DEFAULT_ROUTES = {
  GESTIONNAIRE_SYSTEME: "/dashboard",
  SUPERVISEUR: "/dashboard",
  RESPONSABLE_FINANCIER: "/dashboard",
  AGENT_INSTALLATION: "/parkmeters",
  OPERATEUR: "/intervention-orders",
};

// nav items each role can see
export const ROLE_NAV_ACCESS = {
  GESTIONNAIRE_SYSTEME: [
    "/dashboard",
    "/parkmeters",
    "/sites",
    "/users",
    "/settings",
  ],

  SUPERVISEUR: [
    "/dashboard",
    "/parkmeters",
    "/alerts",
    "/intervention-orders",
    "/settings",
  ],

  RESPONSABLE_FINANCIER: [
    "/dashboard",
    "/sessions",
    "/transactions",
    "/settings",
    "/ai-report"
  ],

  AGENT_INSTALLATION: [
    "/parkmeters",
    "/settings",
  ],

  OPERATEUR: [
    "/intervention-orders",
    "/settings",
  ],
  
};