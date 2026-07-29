export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const escape = (value: string | number | null | undefined) =>
    `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
}

export function downloadExcel(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const esc = (v: string | number | null | undefined) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const makeRow = (cells: Array<string | number | null | undefined>, isHeader = false) =>
    `<Row>${cells
      .map((cell) => {
        const isNum = !isHeader && typeof cell === 'number';
        return `<Cell ss:StyleID="${isHeader ? 'h' : 'd'}"><Data ss:Type="${
          isNum ? 'Number' : 'String'
        }">${esc(cell)}</Data></Cell>`;
      })
      .join('')}</Row>`;

  const xmlParts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?mso-application progid="Excel.Sheet"?>`,
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`,
    `  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`,
    `<Styles>`,
    `<Style ss:ID="h">`,
    `  <Font ss:Bold="1" ss:Size="11"/>`,
    `  <Interior ss:Color="#E8F0FE" ss:Pattern="Solid"/>`,
    `</Style>`,
    `<Style ss:ID="d">`,
    `  <Alignment ss:ReadingOrder="RightToLeft"/>`,
    `</Style>`,
    `</Styles>`,
    `<Worksheet ss:Name="Sheet1"><Table>`,
    makeRow(headers, true),
    ...rows.map((r) => makeRow(r)),
    `</Table></Worksheet>`,
    `</Workbook>`,
  ].join('\n');

  downloadTextFile(filename, '\uFEFF' + xmlParts, 'application/vnd.ms-excel;charset=utf-8');
}
