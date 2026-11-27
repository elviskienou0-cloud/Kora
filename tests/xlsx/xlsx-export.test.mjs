import assert from "node:assert/strict"
import test from "node:test"

import { createXlsxBytes } from "../../src/lib/xlsxExport.js"

function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()
  const files = new Map()
  let offset = 0

  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength))
    files.set(name, decoder.decode(bytes.slice(dataStart, dataStart + size)))
    offset = dataStart + size
  }

  return files
}

test("creates a valid XLSX ZIP with workbook and worksheets", () => {
  const bytes = createXlsxBytes([
    { name: "Synthèse", rows: [["Indicateur", "Valeur"], ["Talents", 3]] },
    { name: "Talents", rows: [["Nom"], ["Talent & Co"]] },
  ])

  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "PK\u0003\u0004")
  assert.equal(new DataView(bytes.buffer).getUint32(bytes.length - 22, true), 0x06054b50)

  const files = readStoredZip(bytes)
  assert.ok(files.has("[Content_Types].xml"))
  assert.ok(files.has("xl/workbook.xml"))
  assert.ok(files.has("xl/worksheets/sheet1.xml"))
  assert.ok(files.has("xl/worksheets/sheet2.xml"))
  assert.match(files.get("xl/workbook.xml"), /Synthèse/)
  assert.match(files.get("xl/worksheets/sheet1.xml"), /<v>3<\/v>/)
  assert.match(files.get("xl/worksheets/sheet2.xml"), /Talent &amp; Co/)
})

test("rejects an empty workbook", () => {
  assert.throws(() => createXlsxBytes([]), /At least one worksheet/)
})

test("sanitizes worksheet names and makes duplicates unique", () => {
  const bytes = createXlsxBytes([
    { name: "Team/Reports", rows: [["A"]] },
    { name: "Team/Reports", rows: [["B"]] },
  ])
  const files = readStoredZip(bytes)
  const workbook = files.get("xl/workbook.xml")
  assert.match(workbook, /Team Reports/)
  assert.match(workbook, /Team Reports 2/)
})
