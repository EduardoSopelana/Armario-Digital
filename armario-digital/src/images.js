// GESTIÓN DE FOTOS
// ---------------------------------------------------------------
// La cámara y la galería devuelven archivos en una carpeta TEMPORAL que el sistema
// puede vaciar. Aquí copiamos cada foto a la carpeta permanente de la app
// (Paths.document) y en los datos guardamos solo la ruta RELATIVA ("fotos/abc.jpg"):
// en iPhone la ruta absoluta de la app puede cambiar al actualizarla, la relativa no.
import { File, Directory, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat, manipulateAsync } from "expo-image-manipulator";
import { uid } from "./constants";

const CARPETA = "fotos";
const TIENE_ESQUEMA = /^[a-z][a-z0-9+.-]*:/i; // file:, content:, http:, ...

// true si la ruta viene de fuera (temporal o antigua) y todavía no está guardada en la app
export function esUriExterna(foto) {
  return !!foto && TIENE_ESQUEMA.test(foto);
}

// Convierte lo que hay guardado en una uri que <Image> pueda mostrar
export function resolverFoto(foto) {
  if (!foto) return null;
  if (esUriExterna(foto)) return foto; // fotos antiguas aún sin migrar
  const base = Paths.document.uri;
  return base + (base.endsWith("/") ? "" : "/") + foto;
}

// Copia la foto a la carpeta permanente y devuelve la ruta relativa.
// Si algo falla, devuelve la original para no perder la foto.
export function guardarImagen(uri) {
  if (!uri) return null;
  if (!esUriExterna(uri)) return uri; // ya está guardada
  try {
    const dir = new Directory(Paths.document, CARPETA);
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
    const origen = new File(uri);
    const nombre = `${uid()}${origen.extension || ".jpg"}`;
    origen.copySync(new File(dir, nombre));
    return `${CARPETA}/${nombre}`;
  } catch (e) {
    return uri;
  }
}

// Borra una foto guardada por la app (ignora las que no son nuestras)
export function borrarImagen(foto) {
  if (!foto || esUriExterna(foto)) return;
  try {
    const archivo = new File(Paths.document, ...foto.split("/"));
    if (archivo.exists) archivo.delete();
  } catch (e) {}
}

export function borrarTodasLasFotos() {
  try {
    const dir = new Directory(Paths.document, CARPETA);
    if (dir.exists) dir.delete();
  } catch (e) {}
}

// Al arrancar: pasa a la carpeta permanente las fotos que se guardaron antes con rutas temporales
export function migrarPrendas(prendas) {
  let cambiado = false;
  const lista = prendas.map((p) => {
    if (!esUriExterna(p.foto)) return p;
    const nueva = guardarImagen(p.foto);
    if (nueva === p.foto) return p; // no se pudo copiar (p. ej. el sistema ya la había borrado)
    cambiado = true;
    return { ...p, foto: nueva };
  });
  return { lista, cambiado };
}

// Reduce una foto y la devuelve como "data URI" (texto) lista para guardar dentro de Firestore.
// 640 px de ancho y calidad 0.6 -> unos 40-90 KB, muy por debajo del límite de 1 MB por documento.
// Si ya es un data URI, se devuelve tal cual.
export async function aBase64Reducida(uri, { ancho = 640, calidad = 0.6, forzar = false } = {}) {
  if (!uri) return null;
  if (uri.startsWith("data:") && !forzar) return uri; // ya reducida (con forzar = true se vuelve a reducir)
  let base64;
  try {
    const contexto = ImageManipulator.manipulate(uri);
    contexto.resize({ width: ancho });
    const imagen = await contexto.renderAsync();
    const res = await imagen.saveAsync({ compress: calidad, format: SaveFormat.JPEG, base64: true });
    base64 = res.base64;
  } catch (e) {
    // Plan B por si la API nueva fallara en algún dispositivo
    const res = await manipulateAsync(uri, [{ resize: { width: ancho } }], { compress: calidad, format: SaveFormat.JPEG, base64: true });
    base64 = res.base64;
  }
  if (!base64) throw new Error("No se pudo procesar la foto.");
  return `data:image/jpeg;base64,${base64}`;
}
