// GESTIÓN DE FOTOS
// ---------------------------------------------------------------
// La cámara y la galería devuelven archivos en una carpeta TEMPORAL que el sistema
// puede vaciar. Aquí copiamos cada foto a la carpeta permanente de la app
// (Paths.document) y en los datos guardamos solo la ruta RELATIVA ("fotos/abc.jpg"):
// en iPhone la ruta absoluta de la app puede cambiar al actualizarla, la relativa no.
import { File, Directory, Paths } from "expo-file-system";
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
