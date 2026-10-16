// Utilidades compartidas por los servicios de Firebase
export const errorPropio = (mensaje) => Object.assign(new Error(mensaje), { propio: true });

// Sin conexión, Firestore deja las escrituras en espera; así evitamos esperar eternamente
export function conTiempo(promesa, ms = 15000) {
  return Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(errorPropio("Sin conexión con el servidor. Comprueba tu internet.")), ms)),
  ]);
}

const MENSAJES = {
  "permission-denied": "Firebase ha rechazado la operación (permisos). ¿Has publicado las reglas nuevas de Firestore?",
  unavailable: "Sin conexión con el servidor. Comprueba tu internet.",
};

// Convierte un error de Firestore en uno con mensaje en español (conserva el código original)
export function traducirFirestore(e) {
  if (e?.propio) return e;
  if (__DEV__) console.warn("Firestore:", e?.code, e?.message);
  return Object.assign(
    errorPropio(MENSAJES[e?.code] || "No se ha podido completar la operación. Inténtalo de nuevo."),
    { code: e?.code }
  );
}
