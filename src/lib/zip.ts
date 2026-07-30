import { crc32 } from "zlib";

// Generador mínimo de archivos ZIP (modo "store", sin compresión). Las fotos y los videos ya
// vienen comprimidos, así que comprimirlos otra vez no ganaría casi nada y sí costaría CPU.
// Se implementa aquí para no sumar una dependencia al proyecto por una sola descarga.

type EntradaZip = { nombre: string; contenido: Buffer };

const FIRMA_LOCAL = 0x04034b50;
const FIRMA_CENTRAL = 0x02014b50;
const FIRMA_FIN = 0x06054b50;

/** Fecha/hora en el formato MS-DOS que usa el ZIP. */
function fechaDos(d: Date): { hora: number; fecha: number } {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, fecha };
}

/**
 * Arma un ZIP con los archivos dados. Todo se resuelve en memoria: pensado para la evidencia
 * de un registro (unas pocas fotos y videos), no para exportaciones masivas.
 */
export function crearZip(entradas: EntradaZip[], fecha = new Date()): Buffer {
  const { hora: horaDos, fecha: fechaDosNum } = fechaDos(fecha);
  const partes: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entrada of entradas) {
    const nombre = Buffer.from(entrada.nombre, "utf8");
    const datos = entrada.contenido;
    const crc = crc32(datos) >>> 0;

    const encabezado = Buffer.alloc(30);
    encabezado.writeUInt32LE(FIRMA_LOCAL, 0);
    encabezado.writeUInt16LE(20, 4); // versión mínima
    encabezado.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    encabezado.writeUInt16LE(0, 8); // método 0 = sin compresión
    encabezado.writeUInt16LE(horaDos, 10);
    encabezado.writeUInt16LE(fechaDosNum, 12);
    encabezado.writeUInt32LE(crc, 14);
    encabezado.writeUInt32LE(datos.length, 18);
    encabezado.writeUInt32LE(datos.length, 22);
    encabezado.writeUInt16LE(nombre.length, 26);
    encabezado.writeUInt16LE(0, 28);

    partes.push(encabezado, nombre, datos);

    const entradaCentral = Buffer.alloc(46);
    entradaCentral.writeUInt32LE(FIRMA_CENTRAL, 0);
    entradaCentral.writeUInt16LE(20, 4); // versión que lo creó
    entradaCentral.writeUInt16LE(20, 6); // versión mínima
    entradaCentral.writeUInt16LE(0x0800, 8);
    entradaCentral.writeUInt16LE(0, 10);
    entradaCentral.writeUInt16LE(horaDos, 12);
    entradaCentral.writeUInt16LE(fechaDosNum, 14);
    entradaCentral.writeUInt32LE(crc, 16);
    entradaCentral.writeUInt32LE(datos.length, 20);
    entradaCentral.writeUInt32LE(datos.length, 24);
    entradaCentral.writeUInt16LE(nombre.length, 28);
    entradaCentral.writeUInt16LE(0, 30); // extra
    entradaCentral.writeUInt16LE(0, 32); // comentario
    entradaCentral.writeUInt16LE(0, 34); // disco
    entradaCentral.writeUInt16LE(0, 36); // atributos internos
    entradaCentral.writeUInt32LE(0, 38); // atributos externos
    entradaCentral.writeUInt32LE(offset, 42);

    central.push(entradaCentral, nombre);
    offset += encabezado.length + nombre.length + datos.length;
  }

  const directorio = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(FIRMA_FIN, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(offset, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...partes, directorio, fin]);
}

/** Deja un texto usable como nombre de archivo dentro del ZIP. */
export function nombreSeguro(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ._-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
