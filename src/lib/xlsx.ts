import { crearZip } from "@/lib/zip";

// Generador mínimo de archivos .xlsx (Excel real, no un CSV renombrado). Un .xlsx es un ZIP con
// unos pocos XML dentro, así que se arma con el mismo `crearZip` que ya usa la descarga de
// evidencia: cero dependencias nuevas.
//
// Alcance a propósito acotado a lo que necesitan las descargas del sistema: una hoja, una fila de
// encabezado y celdas de texto o número. Sin fórmulas, ni fechas con formato de Excel (las fechas
// ya vienen formateadas como texto desde cada endpoint) ni varias hojas.

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL_DOC = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_REL_PKG = "http://schemas.openxmlformats.org/package/2006/relationships";

export type CeldaXlsx = string | number | null | undefined;

/** Escapa texto para XML y descarta los caracteres de control que Excel rechaza. */
function xmlEscape(texto: string): string {
  return texto
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0 → A, 25 → Z, 26 → AA … (referencia de columna de Excel). */
export function letraColumna(indice: number): string {
  let n = indice + 1;
  let letra = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

/** Excel limita el nombre de hoja a 31 caracteres y prohíbe : \ / ? * [ ] */
function nombreHojaSeguro(nombre: string): string {
  const limpio = nombre.replace(/[:\\/?*[\]]/g, "-").trim();
  return (limpio.length > 31 ? limpio.slice(0, 31) : limpio) || "Datos";
}

function celdaXml(valor: CeldaXlsx, ref: string, esEncabezado: boolean): string {
  const estilo = esEncabezado ? ' s="1"' : "";
  if (valor === null || valor === undefined || valor === "") {
    // Aun vacía, la celda del encabezado se emite para que se vea el fondo del estilo.
    return esEncabezado ? `<c r="${ref}"${estilo}/>` : "";
  }
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
  }
  return `<c r="${ref}"${estilo} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(valor))}</t></is></c>`;
}

/** Ancho de columna estimado a partir del contenido, para no tener que ajustar a mano en Excel. */
function anchosDeColumna(filas: CeldaXlsx[][]): number[] {
  const anchos: number[] = [];
  for (const fila of filas) {
    fila.forEach((valor, i) => {
      const largo = valor === null || valor === undefined ? 0 : String(valor).length;
      if (largo > (anchos[i] ?? 0)) anchos[i] = largo;
    });
  }
  return anchos.map((largo) => Math.min(Math.max(largo + 2, 9), 60));
}

/**
 * Arma el libro de Excel. La primera fila se trata como encabezado: queda resaltada, se congela
 * al hacer scroll y lleva el filtro automático de Excel.
 */
export function crearXlsx(filas: CeldaXlsx[][], nombreHoja = "Datos", fecha = new Date()): Buffer {
  const hoja = nombreHojaSeguro(nombreHoja);
  const numColumnas = filas.reduce((max, f) => Math.max(max, f.length), 0);
  const numFilas = filas.length;

  const cols =
    numColumnas > 0
      ? `<cols>${anchosDeColumna(filas)
          .map((ancho, i) => `<col min="${i + 1}" max="${i + 1}" width="${ancho}" customWidth="1"/>`)
          .join("")}</cols>`
      : "";

  const sheetData = filas
    .map((fila, f) => {
      const celdas = fila
        .map((valor, c) => celdaXml(valor, `${letraColumna(c)}${f + 1}`, f === 0))
        .join("");
      return `<row r="${f + 1}">${celdas}</row>`;
    })
    .join("");

  // Rango de la hoja; con datos, además se congela el encabezado y se activa el autofiltro.
  const ultimaRef = numColumnas > 0 ? `${letraColumna(numColumnas - 1)}${Math.max(numFilas, 1)}` : "A1";
  const panelCongelado =
    numFilas > 1
      ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>'
      : "";
  const autoFiltro = numFilas > 1 ? `<autoFilter ref="A1:${ultimaRef}"/>` : "";

  const sheetXml =
    `${XML_DECL}<worksheet xmlns="${NS_MAIN}">` +
    `<dimension ref="A1:${ultimaRef}"/>` +
    `<sheetViews><sheetView workbookViewId="0">${panelCongelado}</sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    cols +
    `<sheetData>${sheetData}</sheetData>` +
    autoFiltro +
    `</worksheet>`;

  const contentTypes =
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const rels =
    `${XML_DECL}<Relationships xmlns="${NS_REL_PKG}">` +
    `<Relationship Id="rId1" Type="${NS_REL_DOC}/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `${XML_DECL}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">` +
    `<sheets><sheet name="${xmlEscape(hoja)}" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

  const workbookRels =
    `${XML_DECL}<Relationships xmlns="${NS_REL_PKG}">` +
    `<Relationship Id="rId1" Type="${NS_REL_DOC}/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="${NS_REL_DOC}/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  // Estilos: el índice 0 es el normal y el 1 el del encabezado (negrita sobre fondo oscuro).
  // Los dos primeros `fill` deben ser "none" y "gray125": Excel los da por sentado.
  const styles =
    `${XML_DECL}<styleSheet xmlns="${NS_MAIN}">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FF334155"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `</cellXfs>` +
    // Sin el estilo "Normal" declarado, algunos lectores avisan que el libro no tiene estilo base.
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;

  return crearZip(
    [
      { nombre: "[Content_Types].xml", contenido: Buffer.from(contentTypes, "utf8") },
      { nombre: "_rels/.rels", contenido: Buffer.from(rels, "utf8") },
      { nombre: "xl/workbook.xml", contenido: Buffer.from(workbook, "utf8") },
      { nombre: "xl/_rels/workbook.xml.rels", contenido: Buffer.from(workbookRels, "utf8") },
      { nombre: "xl/styles.xml", contenido: Buffer.from(styles, "utf8") },
      { nombre: "xl/worksheets/sheet1.xml", contenido: Buffer.from(sheetXml, "utf8") },
    ],
    fecha,
  );
}
