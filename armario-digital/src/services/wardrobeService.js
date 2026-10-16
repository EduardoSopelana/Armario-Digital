// CAPA DE DATOS · ARMARIO (prendas y conjuntos en Firestore)
// ---------------------------------------------------------------
//   users/{uid}/prendas/{id}      cada prenda (la foto va dentro, reducida, como texto base64)
//   users/{uid}/conjuntos/{id}    cada conjunto (lista de ids de prendas)
// Las fotos van dentro del documento para no necesitar Firebase Storage (que exige tarjeta).
// Si algún día se quiere Storage, solo habría que cambiar cómo se guarda y se lee la foto aquí.
import {
  collection, doc, onSnapshot, setDoc, updateDoc, writeBatch, getDocs, arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { resolverFoto, aBase64Reducida } from "../images";

const col = (uid, nombre) => collection(db, "users", uid, nombre);
const ref = (uid, nombre, id) => doc(db, "users", uid, nombre, id);

const MENSAJES = {
  "permission-denied": "Firebase ha rechazado el acceso (permisos). ¿Has publicado las reglas nuevas de Firestore?",
  unavailable: "Sin conexión con el servidor. Comprueba tu internet.",
};

function traducir(e) {
  if (e?.propio) return e;
  if (__DEV__) console.warn("Firestore:", e?.code, e?.message);
  return Object.assign(new Error(MENSAJES[e?.code] || "No se ha podido completar la operación. Inténtalo de nuevo."), { propio: true });
}

// Sin conexión, Firestore deja las escrituras en espera; así evitamos esperar eternamente
function conTiempo(promesa, ms = 20000) {
  return Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(Object.assign(new Error("Sin conexión con el servidor. Comprueba tu internet."), { propio: true })), ms)),
  ]);
}

/* ---------- lectura en tiempo real ---------- */
function escuchar(uid, nombre, onData, onError) {
  return onSnapshot(
    col(uid, nombre),
    (snap) => {
      const lista = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      lista.sort((a, b) => (b.fechaCreacion || "").localeCompare(a.fechaCreacion || ""));
      onData(lista);
    },
    (e) => onError(Object.assign(traducir(e), { code: e?.code }))
  );
}

export const escucharPrendas = (uid, onData, onError) => escuchar(uid, "prendas", onData, onError);
export const escucharConjuntos = (uid, onData, onError) => escuchar(uid, "conjuntos", onData, onError);

/* ---------- escritura ---------- */
export async function guardarPrenda(uid, prenda) {
  if (prenda.foto && prenda.foto.length > 900000) {
    throw Object.assign(new Error("La foto es demasiado grande."), { propio: true });
  }
  try {
    await setDoc(ref(uid, "prendas", prenda.id), prenda);
  } catch (e) {
    throw traducir(e);
  }
}

// Borra la prenda y la quita de los conjuntos que la usaban (todo a la vez)
export async function eliminarPrenda(uid, id, idsConjuntosAfectados) {
  try {
    const batch = writeBatch(db);
    batch.delete(ref(uid, "prendas", id));
    idsConjuntosAfectados.forEach((cid) => batch.update(ref(uid, "conjuntos", cid), { prendaIds: arrayRemove(id) }));
    await batch.commit();
  } catch (e) {
    throw traducir(e);
  }
}

export async function guardarConjunto(uid, conjunto) {
  try {
    await setDoc(ref(uid, "conjuntos", conjunto.id), conjunto);
  } catch (e) {
    throw traducir(e);
  }
}

export async function eliminarConjunto(uid, id) {
  try {
    const batch = writeBatch(db);
    batch.delete(ref(uid, "conjuntos", id));
    await batch.commit();
  } catch (e) {
    throw traducir(e);
  }
}

// Cambia uno o varios campos de un documento (por ejemplo, favorito)
export async function actualizarCampo(uid, nombre, id, cambios) {
  try {
    await updateDoc(ref(uid, nombre, id), cambios);
  } catch (e) {
    throw traducir(e);
  }
}

export async function borrarTodo(uid) {
  try {
    for (const nombre of ["prendas", "conjuntos"]) {
      const snap = await getDocs(col(uid, nombre));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (e) {
    throw traducir(e);
  }
}

/* ---------- migración de lo que había solo en el móvil ---------- */
export async function subirLocales(uid, prendas, conjuntos, onProgreso) {
  const total = prendas.length + conjuntos.length;
  let hecho = 0;

  for (const p of prendas) {
    let foto = null;
    if (p.foto) {
      try {
        foto = p.foto.startsWith("data:") ? p.foto : await aBase64Reducida(resolverFoto(p.foto));
      } catch (e) {
        foto = null; // si la foto ya no existe, se sube la prenda sin foto
      }
    }
    try {
      await conTiempo(setDoc(ref(uid, "prendas", p.id), { ...p, foto, favorito: !!p.favorito }));
    } catch (e) {
      throw traducir(e);
    }
    onProgreso(++hecho, total);
  }

  for (const c of conjuntos) {
    try {
      await conTiempo(setDoc(ref(uid, "conjuntos", c.id), { ...c, favorito: !!c.favorito }));
    } catch (e) {
      throw traducir(e);
    }
    onProgreso(++hecho, total);
  }
}
