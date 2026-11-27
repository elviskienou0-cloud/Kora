const encoder = new TextEncoder()

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function columnName(index) {
  let value = index + 1
  let result = ""
  while (value > 0) {
    const remainder = (value - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    value = Math.floor((value - 1) / 26)
  }
  return result
}

function worksheetXml(rows) {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = (Array.isArray(row) ? row : []).map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${reference}"><v>${value}</v></c>`
      }
      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`
    }).join("")
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function uint16(value) {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, value, true)
  return bytes
}

function uint32(value) {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true)
  return bytes
}

function concatBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0)
  const result = new Uint8Array(size)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function zipStore(files) {
  const localParts = []
  const centralParts = []
  let localOffset = 0

  for (const file of files) {
    const name = encoder.encode(file.path)
    const data = encoder.encode(file.content)
    const checksum = crc32(data)
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(33),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      name,
    ])
    localParts.push(localHeader, data)

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(33),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(localOffset),
      name,
    ])
    centralParts.push(centralHeader)
    localOffset += localHeader.length + data.length
  }

  const centralDirectory = concatBytes(centralParts)
  const endRecord = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(localOffset),
    uint16(0),
  ])

  return concatBytes([...localParts, centralDirectory, endRecord])
}

function normalizeSheetName(value, index, used) {
  const base = String(value || `Sheet ${index + 1}`)
    .replace(/[\\[\\]*\\/?\\:]/g, " ")
    .trim()
    .slice(0, 31) || `Sheet ${index + 1}`
  let name = base
  let suffix = 2
  while (used.has(name.toLowerCase())) {
    const ending = ` ${suffix}`
    name = `${base.slice(0, 31 - ending.length)}${ending}`
    suffix += 1
  }
  used.add(name.toLowerCase())
  return name
}

export function createXlsxBytes(sheets) {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw new TypeError("At least one worksheet is required.")
  }
  if (sheets.length > 20) {
    throw new RangeError("A KORA report cannot contain more than 20 worksheets.")
  }

  const usedNames = new Set()
  const normalizedSheets = sheets.map((sheet, index) => ({
    name: normalizeSheetName(sheet?.name, index, usedNames),
    rows: Array.isArray(sheet?.rows) ? sheet.rows : [],
  }))

  const sheetOverrides = normalizedSheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("")
  const workbookSheets = normalizedSheets.map((sheet, index) =>
    `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("")
  const workbookRelationships = normalizedSheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("")

  const files = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRelationships}
</Relationships>`,
    },
    ...normalizedSheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet.rows),
    })),
  ]

  return zipStore(files)
}
