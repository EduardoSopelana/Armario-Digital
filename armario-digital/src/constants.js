export const CATEGORIAS = [
  { id: "superior", label: "Parte superior" },
  { id: "inferior", label: "Parte inferior" },
  { id: "vestido", label: "Vestido" },
  { id: "calzado", label: "Calzado" },
  { id: "abrigo", label: "Abrigo" },
  { id: "accesorio", label: "Accesorios" },
];
export const CAT_LABEL = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.label]));

export const TIPOS_POR_CATEGORIA = {
  superior: ["Camiseta", "Camisa", "Polo", "Sudadera", "Jersey"],
  inferior: ["Pantalón", "Vaquero", "Short", "Falda"],
  vestido: ["Vestido"],
  calzado: ["Zapatillas", "Zapatos", "Botas", "Castellanos"],
  abrigo: ["Chaqueta", "Abrigo"],
  accesorio: ["Cinturón", "Bufanda", "Gorra", "Guantes", "Corbata", "Calcetines"],
};
export const TODOS_LOS_TIPOS = Object.values(TIPOS_POR_CATEGORIA).flat();

export const ESTACIONES = [
  { id: "Primavera", icon: "flower-outline" },
  { id: "Verano", icon: "sunny-outline" },
  { id: "Otoño", icon: "leaf-outline" },
  { id: "Invierno", icon: "snow-outline" },
];

export const COLORES = [
  { nombre: "Blanco", hex: "#FFFFFF" },
  { nombre: "Negro", hex: "#221F1C" },
  { nombre: "Gris", hex: "#9C958A" },
  { nombre: "Beige", hex: "#D8C8A8" },
  { nombre: "Marrón", hex: "#7B5B3A" },
  { nombre: "Azul", hex: "#3B5C82" },
  { nombre: "Verde", hex: "#5C7350" },
  { nombre: "Rojo", hex: "#9C3B34" },
  { nombre: "Rosa", hex: "#D89AA5" },
  { nombre: "Amarillo", hex: "#D8B24A" },
  { nombre: "Morado", hex: "#6E5A80" },
  { nombre: "Naranja", hex: "#C77A3E" },
];
export const COLOR_HEX = Object.fromEntries(COLORES.map((c) => [c.nombre, c.hex]));

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
