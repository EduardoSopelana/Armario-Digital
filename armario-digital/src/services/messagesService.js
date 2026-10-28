// CAPA DE DATOS · MENSAJES (Firestore, en tiempo real)
// ---------------------------------------------------------------
//   chats/{uidA_uidB}                  { users, estado, iniciador, enviados, ultimo, actualizado }
//   chats/{uidA_uidB}/mensajes/{id}    { de, texto, adjunto, fecha }
//
// Reglas de envío (las hace cumplir firestore.rules; aquí se replican para avisar al usuario):
//  - Seguimiento mutuo, destinatario público o que admite a cualquiera -> conversación abierta, sin límite.
//  - Si no, la conversación queda "pendiente": quien escribe primero puede enviar 2 mensajes hasta que la
//    otra persona la acepte (o responda).
//  - Si el destinatario solo admite seguimiento mutuo y no lo hay, no se le puede escribir.
import { collection, doc, onSnapshot, query, where, orderBy, writeBatch, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { conTiempo, errorPropio, traducirFirestore } from "./util";
import { aBase64Reducida } from "../images";

export const LIMITE_SIN_ACEPTAR = 2;

export const idChat = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

export const esMutuo = (rel) => rel?.yoSigo === "accepted" && rel?.meSigue === "accepted";

/* ---------- lectura en tiempo real ---------- */
export function escucharChats(miUid, onData, onError) {
  const q = query(collection(db, "chats"), where("users", "array-contains", miUid));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const x = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            otroUid: x.users.find((u) => u !== miUid),
            estado: x.estado,
            iniciador: x.iniciador,
            enviados: x.enviados || 0,
            ultimo: x.ultimo || null,
            actualizado: x.actualizado?.toMillis ? x.actualizado.toMillis() : Date.now(),
          };
        })
      );
    },
    (e) => onError(traducirFirestore(e))
  );
}

export function escucharMensajes(chatId, onData, onError) {
  const q = query(collection(db, "chats", chatId, "mensajes"), orderBy("fecha", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const x = d.data({ serverTimestamps: "estimate" });
          return { id: d.id, ...x, fecha: x.fecha?.toMillis ? x.fecha.toMillis() : Date.now() };
        })
      );
    },
    (e) => onError(traducirFirestore(e))
  );
}

/* ---------- qué puedo hacer ahora mismo en una conversación ---------- */
// Devuelve { puede, restantes?, motivo? }. Sin conversación todavía, se puede intentar (las reglas deciden).
export function estadoDeEnvio({ chat, miUid, mutuo }) {
  if (!chat || mutuo || chat.estado === "abierta") return { puede: true };
  if (chat.iniciador !== miUid) return { puede: true }; // al responder, la solicitud se acepta
  if (chat.estado === "rechazada") return { puede: false, motivo: "rechazada" };
  const restantes = LIMITE_SIN_ACEPTAR - (chat.enviados || 0);
  return restantes > 0 ? { puede: true, restantes } : { puede: false, motivo: "limite" };
}

/* ---------- envío ---------- */
// Convierte un conjunto propio en algo que el otro pueda ver sin acceso a mi armario:
// se incluyen miniaturas de sus prendas dentro del propio mensaje.
export async function prepararAdjunto(adjunto, prendas) {
  if (!adjunto || adjunto.tipo !== "propio") return adjunto || null;
  const items = (adjunto.prendaIds || []).map((id) => prendas.find((p) => p.id === id)).filter(Boolean).slice(0, 6);
  const miniaturas = [];
  for (const p of items) {
    let foto = null;
    if (p.foto) {
      try {
        foto = await aBase64Reducida(p.foto, { ancho: 160, calidad: 0.5, forzar: true });
      } catch (e) {
        foto = p.foto.length < 60000 ? p.foto : null;
      }
    }
    miniaturas.push({ nombre: p.nombre, categoria: p.categoria, foto });
  }
  return { tipo: "propio", nombre: adjunto.nombre, items: miniaturas };
}

export async function enviarMensaje({ miUid, otroUid, chat, texto, adjunto, mutuo }) {
  const t = (texto || "").trim();
  if (!t && !adjunto) return;

  const chatRef = doc(db, "chats", idChat(miUid, otroUid));
  const mensajeRef = doc(collection(chatRef, "mensajes"));
  const ultimo = { de: miUid, texto: (t || "Conjunto compartido").slice(0, 80) };
  const ahora = serverTimestamp();
  const batch = writeBatch(db);

  try {
    if (!chat) {
      // Primer mensaje: se mira en ese momento cómo tiene la otra persona su perfil y sus ajustes
      const snap = await getDoc(doc(db, "users", otroUid));
      const datos = snap.exists() ? snap.data() : {};
      const ajuste = datos.mensajesDe || "normal";
      const publico = (datos.privacidadConjuntos || "publico") === "publico";
      if (ajuste === "mutuos" && !mutuo) {
        throw errorPropio("Esta persona solo recibe mensajes de quien tiene seguimiento mutuo con ella.");
      }
      const libre = mutuo || publico || ajuste === "todos";
      batch.set(chatRef, {
        users: [miUid, otroUid].sort(),
        estado: libre ? "abierta" : "pendiente",
        iniciador: miUid,
        enviados: libre ? 0 : 1,
        ultimo,
        actualizado: ahora,
      });
    } else if (chat.estado === "abierta") {
      batch.update(chatRef, { ultimo, actualizado: ahora });
    } else if (chat.iniciador !== miUid || mutuo) {
      // Quien recibe responde (equivale a aceptar) o ya hay seguimiento mutuo: la conversación se abre
      batch.update(chatRef, { estado: "abierta", ultimo, actualizado: ahora });
    } else if (chat.estado === "pendiente" && (chat.enviados || 0) < LIMITE_SIN_ACEPTAR) {
      batch.update(chatRef, { enviados: (chat.enviados || 0) + 1, ultimo, actualizado: ahora });
    } else {
      throw errorPropio("Has alcanzado el límite de mensajes hasta que la otra persona acepte chatear contigo.");
    }
    batch.set(mensajeRef, { de: miUid, texto: t, adjunto: adjunto || null, fecha: ahora });
    await conTiempo(batch.commit());
  } catch (e) {
    if (e?.code === "permission-denied") {
      throw errorPropio(
        "No se ha podido enviar. Puede que esa persona haya cambiado sus ajustes de mensajes, que hayas alcanzado el límite, o que falten las reglas nuevas de Firestore."
      );
    }
    throw traducirFirestore(e);
  }
}

/* ---------- solicitudes de conversación ---------- */
export async function aceptarChat(chatId) {
  try {
    await conTiempo(updateDoc(doc(db, "chats", chatId), { estado: "abierta" }));
  } catch (e) {
    throw traducirFirestore(e);
  }
}

export async function rechazarChat(chatId) {
  try {
    await conTiempo(updateDoc(doc(db, "chats", chatId), { estado: "rechazada" }));
  } catch (e) {
    throw traducirFirestore(e);
  }
}
