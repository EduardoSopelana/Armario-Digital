// CAPA DE DATOS · AMIGOS (versión local con datos de ejemplo)
// En Firebase: colección de usuarios + relaciones de amistad. Las pantallas no cambian.
import { getJSON, setJSON } from "../storage";
import { FRIENDS_DEMO } from "../data/demoData";

const KEY = "amigos";

export async function getFriendIds() {
  return getJSON(KEY, []);
}

export async function toggleFriend(id, actuales) {
  const lista = actuales.includes(id) ? actuales.filter((a) => a !== id) : [...actuales, id];
  await setJSON(KEY, lista);
  return lista;
}

export async function searchUsers(texto) {
  const t = texto.trim().toLowerCase();
  return FRIENDS_DEMO.filter((f) => f.alias.toLowerCase().includes(t) || f.nombre.toLowerCase().includes(t));
}

export async function getUsersByIds(ids) {
  return FRIENDS_DEMO.filter((f) => ids.includes(f.id));
}
