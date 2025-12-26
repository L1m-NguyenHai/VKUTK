import React, { createContext, useContext, useState } from "react";

interface NavbarContextType {
  isNavbarVisible: boolean;
  toggleNavbar: () => void;
  setNavbarVisible: (visible: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  const toggleNavbar = () => setIsNavbarVisible((prev) => !prev);
  const setNavbarVisible = (visible: boolean) => setIsNavbarVisible(visible);

  return (
    <NavbarContext.Provider
      value={{ isNavbarVisible, toggleNavbar, setNavbarVisible }}
    >
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error("useNavbar must be used within a NavbarProvider");
  }
  return context;
}
