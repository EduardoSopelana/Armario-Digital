// CAPA DE DATOS · TELÉFONO Y SUGERENCIAS DE CONTACTOS
// ---------------------------------------------------------------
//   users/{uid}/private/settings   { telefono, telefonoDescubrible }   (solo lo ve su dueño)
//   phoneIndex/{huella}            { uid }                              (solo se puede leer UNO a UNO)
// El número NUNCA se guarda en claro en un sitio visible para otros: el índice usa una huella
// (SHA-256) del número. Para buscar a tus contactos, el móvil calcula la huella de cada número de
// tu agenda y pregunta si existe en el índice. No se envían nombres ni se guarda tu agenda.
//
// IMPORTANTE: el número todavía NO está verificado por SMS: cualquiera podría escribir un número
// que no es suyo. Por eso el índice solo sirve para SUGERIR personas (siempre hay que pedir seguir)
// y no se enseña el número a nadie.
import * as Crypto from "expo-crypto";
import * as Contacts from "expo-contacts/legacy";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { errorPropio, traducirFirestore } from "./util";
import { obtenerPerfiles } from "./friendsService";

const PREFIJO_POR_DEFECTO = "+34";
const MAX_CONTACTOS = 500;
const cacheSugerencias = new Map(); // uid -> sugerencias (solo mientras la app está abierta)

// "612 34 56 78" -> "+34612345678"; "0034 612..." -> "+34612..."; devuelve null si no parece un número
export function normalizarTelefono(texto, prefijo = PREFIJO_POR_DEFECTO) {
  let t = String(texto || "").replace(/[\s().-]/g, "");
  if (t.startsWith("00")) t = "+" + t.slice(2);
  if (!t.startsWith("+")) t = prefijo + t.replace(/^0+/, "");
  return /^\+[1-9][0-9]{7,14}$/.test(t) ? t : null;
}

export async function huellaTelefono(telefonoNormalizado) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `armario:${telefonoNormalizado}`);
}

// Guarda (o quita) mi teléfono y lo añade (o no) al índice de búsqueda por contactos
export async function guardarTelefono(uid, perfilActual, telefono, descubrible) {
  try {
    const indiceAntes = perfilActual.telefono && perfilActual.telefonoDescubrible
      ? await huellaTelefono(perfilActual.telefono) : null;
    const indiceDespues = telefono && descubrible ? await huellaTelefono(telefono) : null;

    if (indiceDespues && indiceDespues !== indiceAntes) {
      const existente = await getDoc(doc(db, "phoneIndex", indiceDespues));
      if (existente.exists() && existente.data().uid !== uid) {
        throw errorPropio("Ese número ya está asociado a otra cuenta.");
      }
    }

    const batch = writeBatch(db);
    if (indiceAntes && indiceAntes !== indiceDespues) batch.delete(doc(db, "phoneIndex", indiceAntes));
    if (indiceDespues && indiceDespues !== indiceAntes) batch.set(doc(db, "phoneIndex", indiceDespues), { uid });
    batch.set(
      doc(db, "users", uid, "private", "settings"),
      { telefono: telefono || null, telefonoDescubrible: !!descubrible },
      { merge: true }
    );
    await batch.commit();
    cacheSugerencias.delete(uid);
  } catch (e) {
    throw traducirFirestore(e);
  }
}

// Devuelve las personas registradas que tienes en tus contactos: [{ perfil, contacto }]
// - pedirPermiso = false: no pregunta; devuelve null si todavía no hay permiso.
// - forzar = true: ignora la memoria y vuelve a consultar.
export async function sugerenciasDeContactos(miUid, { pedirPermiso = true, forzar = false } = {}) {
  if (!forzar && cacheSugerencias.has(miUid)) return cacheSugerencias.get(miUid);

  let { status } = await Contacts.getPermissionsAsync();
  if (status !== "granted") {
    if (!pedirPermiso) return null;
    status = (await Contacts.requestPermissionsAsync()).status;
    if (status !== "granted") {
      throw errorPropio("Para ver sugerencias necesitamos acceso a tus contactos. Puedes darlo en los ajustes del móvil.");
    }
  }

  try {
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers] });

    // huella -> nombre del contacto (los nombres nunca salen del móvil)
    const porHuella = new Map();
    for (const contacto of data) {
      for (const tel of contacto.phoneNumbers || []) {
        const normalizado = normalizarTelefono(tel.number);
        if (!normalizado || porHuella.size >= MAX_CONTACTOS) continue;
        const huella = await huellaTelefono(normalizado);
        if (!porHuella.has(huella)) porHuella.set(huella, contacto.name || "");
      }
    }

    // Se consulta de 20 en 20 si cada huella existe en el índice (lectura una a una)
    const huellas = [...porHuella.keys()];
    const encontrados = []; // { uid, contacto }
    for (let i = 0; i < huellas.length; i += 20) {
      const lote = huellas.slice(i, i + 20);
      const docs = await Promise.all(lote.map((h) => getDoc(doc(db, "phoneIndex", h))));
      docs.forEach((d, k) => {
        if (d.exists() && d.data().uid !== miUid) encontrados.push({ uid: d.data().uid, contacto: porHuella.get(lote[k]) });
      });
    }

    const perfiles = await obtenerPerfiles(encontrados.map((e) => e.uid));
    const resultado = perfiles.map((perfil) => ({
      perfil,
      contacto: encontrados.find((e) => e.uid === perfil.id)?.contacto || "",
    }));
    cacheSugerencias.set(miUid, resultado);
    return resultado;
  } catch (e) {
    throw traducirFirestore(e);
  }
}
