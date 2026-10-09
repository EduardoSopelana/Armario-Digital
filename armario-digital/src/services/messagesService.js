// CAPA DE DATOS · MENSAJES (versión local)
// En Firebase: Firestore con escucha en tiempo real. Las pantallas no cambian.
import { getJSON, setJSON } from "../storage";
import { uid } from "../constants";

const KEY = "mensajes"; // { [amigoId]: [mensaje] }

export async function getAllMessages() {
  return getJSON(KEY, {});
}

export async function sendMessage(todos, amigoId, texto, adjunto) {
  const nuevo = { id: uid(), de: "yo", texto, adjunto: adjunto || null, fecha: new Date().toISOString() };
  const actualizado = { ...todos, [amigoId]: [...(todos[amigoId] || []), nuevo] };
  await setJSON(KEY, actualizado);
  return actualizado;
}
