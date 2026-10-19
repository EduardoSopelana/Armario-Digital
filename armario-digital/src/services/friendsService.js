// CAPA DE DATOS · SEGUIDORES (Firestore)
// ---------------------------------------------------------------
//   follows/{seguidor_seguido}   { users: [seguidor, seguido], follower, followed, status, createdAt }
// Es UNIDIRECCIONAL: que A siga a B no significa que B siga a A. Para seguir hay que pedirlo
// y quien recibe la solicitud la acepta. Quién puede hacer cada cosa lo decide firestore.rules.
import {
  collection, doc, query, where, limit, onSnapshot, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { conTiempo, errorPropio, traducirFirestore } from "./util";

const cachePerfiles = new Map(); // uid -> perfil (en memoria, mientras la app está abierta)

export const idSeguimiento = (seguidor, seguido) => `${seguidor}_${seguido}`;

function aPerfil(uid, d) {
  const perfil = {
    id: uid,
    alias: d.alias,
    nombre: d.nombre,
    foto: d.foto || null,
    privacidadConjuntos: d.privacidadConjuntos || "publico",
  };
  cachePerfiles.set(uid, perfil);
  return perfil;
}

/* ---------- lectura ---------- */
// Escucha en tiempo real mis relaciones con cada persona. Devuelve una lista de
//   { otroUid, yoSigo, meSigue, fechaYoSigo, fechaMeSigue }   (estados: null | "pending" | "accepted")
// "yoSigo": yo le sigo (o le he pedido seguirle). "meSigue": me sigue (o me ha pedido seguirme).
export function escucharRelaciones(miUid, onData, onError) {
  const q = query(collection(db, "follows"), where("users", "array-contains", miUid));
  return onSnapshot(
    q,
    (snap) => {
      const porPersona = new Map();
      snap.docs.forEach((d) => {
        const data = d.data();
        const yoSoySeguidor = data.follower === miUid;
        const otroUid = yoSoySeguidor ? data.followed : data.follower;
        const fecha = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
        const rel = porPersona.get(otroUid) || { otroUid, yoSigo: null, meSigue: null, fechaYoSigo: 0, fechaMeSigue: 0 };
        if (yoSoySeguidor) { rel.yoSigo = data.status; rel.fechaYoSigo = fecha; }
        else { rel.meSigue = data.status; rel.fechaMeSigue = fecha; }
        porPersona.set(otroUid, rel);
      });
      onData([...porPersona.values()]);
    },
    (e) => onError(traducirFirestore(e))
  );
}

// Busca usuarios cuyo alias empiece por el texto (el alias siempre va en minúsculas)
export async function buscarUsuarios(texto, miUid) {
  const t = texto.trim().toLowerCase();
  if (t.length < 2) return [];
  try {
    const q = query(collection(db, "users"), where("alias", ">=", t), where("alias", "<=", t + "\uf8ff"), limit(20));
    const snap = await getDocs(q);
    return snap.docs.filter((d) => d.id !== miUid).map((d) => aPerfil(d.id, d.data()));
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Perfiles públicos de una lista de uid (usa la memoria para no repetir lecturas)
export async function obtenerPerfiles(uids) {
  const unicos = [...new Set(uids)];
  try {
    return await Promise.all(
      unicos.map(async (uid) => {
        if (cachePerfiles.has(uid)) return cachePerfiles.get(uid);
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? aPerfil(uid, snap.data()) : { id: uid, alias: "desconocido", nombre: "Usuario eliminado", foto: null };
      })
    );
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Mismo nombre que usaban los mensajes
export const getUsersByIds = obtenerPerfiles;

/* ---------- acciones ---------- */
// Seguir a alguien. Si su perfil es público se le sigue al instante ("accepted");
// si es privado se envía una solicitud ("pending") que él tendrá que aceptar. Devuelve el estado.
export async function seguir(miUid, otroUid) {
  if (miUid === otroUid) throw errorPropio("No puedes seguirte a ti mismo.");
  try {
    const perfil = await getDoc(doc(db, "users", otroUid)); // se lee en el momento, no de la memoria
    if (!perfil.exists()) throw errorPropio("Esa persona ya no existe.");
    aPerfil(otroUid, perfil.data());
    const status = (perfil.data().privacidadConjuntos || "publico") === "publico" ? "accepted" : "pending";
    await conTiempo(
      setDoc(doc(db, "follows", idSeguimiento(miUid, otroUid)), {
        users: [miUid, otroUid],
        follower: miUid,
        followed: otroUid,
        status,
        createdAt: serverTimestamp(),
      })
    );
    return status;
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Aceptar que alguien me siga
export async function aceptarSeguidor(miUid, seguidorUid) {
  try {
    await conTiempo(updateDoc(doc(db, "follows", idSeguimiento(seguidorUid, miUid)), { status: "accepted" }));
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Dejar de seguir a alguien (también cancela una solicitud que yo había enviado)
export async function dejarDeSeguir(miUid, otroUid) {
  try {
    await conTiempo(deleteDoc(doc(db, "follows", idSeguimiento(miUid, otroUid))));
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Quitar a alguien de mis seguidores (también rechaza una solicitud que me había enviado)
export async function quitarSeguidor(miUid, seguidorUid) {
  try {
    await conTiempo(deleteDoc(doc(db, "follows", idSeguimiento(seguidorUid, miUid))));
  } catch (e) {
    throw traducirFirestore(e);
  }
}
