import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getJSON, setJSON } from "./storage";

export const LIGHT = {
  bg: "#F6F1E9", surface: "#FFFFFF", ink: "#2A2420", inkSoft: "#7A6F63", inkFaint: "#A79C8E",
  accent: "#6E2E3F", accentSoft: "#F1DEE1", accentSofter: "#F8ECEE", gold: "#A97D3F", goldSoft: "#F2E7D4",
  line: "#E6DECD", danger: "#9A3324", dangerSoft: "#F5E1DC",
  onAccent: "#FFFFFF", // color del texto/iconos sobre fondo "accent"
  heart: "#6E2E3F",
};

export const DARK = {
  bg: "#1C1815", surface: "#262120", ink: "#F2ECE3", inkSoft: "#B6AA9C", inkFaint: "#766A5D",
  accent: "#E394A8", accentSoft: "#45262E", accentSofter: "#332024", gold: "#D8B878", goldSoft: "#3A3024",
  line: "#3A332C", danger: "#E2746A", dangerSoft: "#3A2420",
  onAccent: "#2A1218",
  heart: "#C9506F",
};

const ThemeContext = createContext({ colors: LIGHT, tema: "light", setTema: () => {} });

export function ThemeProvider({ children }) {
  const [tema, setTemaState] = useState("light");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    (async () => {
      const guardado = await getJSON("tema", "light");
      setTemaState(guardado === "dark" ? "dark" : "light");
      setListo(true);
    })();
  }, []);

  const value = useMemo(
    () => ({
      colors: tema === "dark" ? DARK : LIGHT,
      tema,
      setTema: (t) => { setTemaState(t); setJSON("tema", t); },
    }),
    [tema]
  );

  if (!listo) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Crea los estilos a partir de una función (colors) => StyleSheet.create({...})
// y los recalcula solo cuando cambia el tema.
export function useStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
