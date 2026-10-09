// Datos de ejemplo. En la versión con Firebase vendrán de la base de datos compartida.
export const FRIENDS_DEMO = [
  { id: "f1", alias: "martaestilo", nombre: "Marta Core", privado: false,
    looks: [{ nombre: "Look casual verano", estacion: "Verano", colores: ["#D8C8A8", "#FFFFFF", "#9C958A"] },
            { nombre: "Noche fuera", estacion: "Otoño", colores: ["#221F1C", "#7B5B3A"] }] },
  { id: "f2", alias: "pablo.denim", nombre: "Pablo Ruiz", privado: false,
    looks: [{ nombre: "Diario", estacion: "Primavera", colores: ["#3B5C82", "#FFFFFF"] }] },
  { id: "f3", alias: "sofia_looks", nombre: "Sofía Nuñez", privado: true, looks: [] },
  { id: "f4", alias: "carlos.street", nombre: "Carlos Vega", privado: false,
    looks: [{ nombre: "Deportivo", estacion: "Invierno", colores: ["#221F1C", "#9C958A", "#C77A3E"] },
            { nombre: "Look elegante", estacion: "Otoño", colores: ["#7B5B3A", "#D8C8A8"] }] },
  { id: "f5", alias: "lucia.vintage", nombre: "Lucía Ferrer", privado: false,
    looks: [{ nombre: "Look vintage", estacion: "Otoño", colores: ["#7B5B3A", "#D8B24A", "#221F1C"] }] },
];

export const FAMOSOS_DEMO = [
  { id: "cel1", nombre: "Look pasarela A", looks: [
    { nombre: "Total black elegante", estacion: "Otoño", colores: ["#221F1C", "#221F1C", "#7B5B3A"] },
    { nombre: "Street style", estacion: "Primavera", colores: ["#3B5C82", "#D8C8A8"] },
  ]},
  { id: "cel2", nombre: "Look pasarela B", looks: [
    { nombre: "Gala en blanco", estacion: "Verano", colores: ["#FFFFFF", "#D8B24A"] },
  ]},
  { id: "cel3", nombre: "Look pasarela C", looks: [
    { nombre: "Capas de invierno", estacion: "Invierno", colores: ["#9C958A", "#221F1C", "#7B5B3A"] },
    { nombre: "Color block", estacion: "Verano", colores: ["#9C3B34", "#D8B24A", "#3B5C82"] },
  ]},
];
