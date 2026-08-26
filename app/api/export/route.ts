import ExcelJS from "exceljs";
import { MONEY } from "../../../lib/money";

export const runtime = "nodejs";

type ExportPayload = {
  counts?: Record<string, unknown>;
  generatedAt?: string;
  localDate?: string;
  timezone?: string;
};

const currencyFormat = '"$"#,##0.00';
const green = "176B52";
const darkGreen = "102D24";
const paleGreen = "E3F2EB";

function safeCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(1_000_000, Math.max(0, Math.trunc(value)));
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as ExportPayload;
    const counts = Object.fromEntries(MONEY.map((item) => [item.id, safeCount(payload.counts?.[item.id])]));
    const totalPieces = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (!totalPieces) {
      return Response.json({ error: "No hay efectivo contado para exportar." }, { status: 400 });
    }

    const localDate = /^\d{4}-\d{2}-\d{2}$/.test(payload.localDate ?? "")
      ? payload.localDate as string
      : new Date().toISOString().slice(0, 10);
    const generatedAt = payload.generatedAt && !Number.isNaN(Date.parse(payload.generatedAt))
      ? new Date(payload.generatedAt)
      : new Date();
    const orderedMoney = [...MONEY].sort((a, b) => {
      if (a.type !== b.type) return a.type === "bill" ? -1 : 1;
      return b.value - a.value;
    });
    const totalAmount = orderedMoney.reduce((sum, item) => sum + (item.value / 100) * counts[item.id], 0);
    const billPieces = orderedMoney.filter((item) => item.type === "bill").reduce((sum, item) => sum + counts[item.id], 0);
    const coinPieces = totalPieces - billPieces;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Cuenta Pesos";
    workbook.created = generatedAt;
    workbook.modified = generatedAt;
    workbook.subject = `Corte diario de efectivo ${localDate}`;
    workbook.title = `Corte de caja ${localDate}`;

    const sheet = workbook.addWorksheet("Corte diario", {
      properties: { tabColor: { argb: green } },
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
      views: [{ state: "frozen", ySplit: 7, showGridLines: false }],
    });

    sheet.columns = [
      { key: "denomination", width: 19 },
      { key: "unitValue", width: 18 },
      { key: "type", width: 15 },
      { key: "quantity", width: 13 },
      { key: "subtotal", width: 20 },
    ];

    sheet.mergeCells("A1:E1");
    const title = sheet.getCell("A1");
    title.value = "CUENTA PESOS · CORTE DIARIO";
    title.font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FFFFFF" } };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
    title.alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(1).height = 38;

    sheet.getCell("A2").value = "Fecha del corte";
    sheet.getCell("B2").value = generatedAt;
    sheet.getCell("B2").numFmt = "dd/mm/yyyy hh:mm";
    sheet.getCell("A3").value = "Total contado";
    sheet.getCell("B3").value = { formula: "SUM(E8:E22)", result: totalAmount };
    sheet.getCell("B3").numFmt = currencyFormat;
    sheet.getCell("A4").value = "Zona horaria";
    sheet.getCell("B4").value = payload.timezone || "Local";

    sheet.getCell("D2").value = "Total de piezas";
    sheet.getCell("E2").value = { formula: "SUM(D8:D22)", result: totalPieces };
    sheet.getCell("D3").value = "Billetes";
    sheet.getCell("E3").value = { formula: "SUMIF(C8:C22,\"Billete\",D8:D22)", result: billPieces };
    sheet.getCell("D4").value = "Monedas";
    sheet.getCell("E4").value = { formula: "SUMIF(C8:C22,\"Moneda\",D8:D22)", result: coinPieces };

    ["A2", "A3", "A4", "D2", "D3", "D4"].forEach((address) => {
      const cell = sheet.getCell(address);
      cell.font = { bold: true, color: { argb: darkGreen } };
    });
    for (let row = 2; row <= 4; row += 1) {
      [1, 2, 4, 5].forEach((column) => {
        const cell = sheet.getCell(row, column);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: paleGreen } };
        cell.border = {
          top: { style: "thin", color: { argb: "C8DED4" } },
          bottom: { style: "thin", color: { argb: "C8DED4" } },
        };
      });
    }
    sheet.getCell("B3").font = { size: 15, bold: true, color: { argb: green } };
    sheet.getCell("E2").font = { size: 14, bold: true, color: { argb: green } };

    const headerRow = sheet.getRow(7);
    headerRow.values = ["Denominación", "Valor unitario", "Tipo", "Cantidad", "Subtotal"];
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: green } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    orderedMoney.forEach((item, index) => {
      const rowNumber = 8 + index;
      const count = counts[item.id];
      const row = sheet.getRow(rowNumber);
      row.values = [item.label, item.value / 100, item.type === "bill" ? "Billete" : "Moneda", count];
      row.getCell(5).value = { formula: `B${rowNumber}*D${rowNumber}`, result: (item.value / 100) * count };
      row.getCell(2).numFmt = currencyFormat;
      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = currencyFormat;
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(4).font = { bold: true, color: { argb: "1E5AA8" } };
      row.getCell(5).font = { bold: count > 0, color: { argb: count > 0 ? green : "64726B" } };
      row.alignment = { vertical: "middle" };
      row.height = 22;
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F7F9F7" } };
        });
      }
      row.eachCell((cell) => {
        cell.border = { bottom: { style: "hair", color: { argb: "DDE3DF" } } };
      });
    });

    sheet.autoFilter = { from: "A7", to: "E22" };
    sheet.mergeCells("C24:D24");
    sheet.getCell("C24").value = "TOTAL GENERAL";
    sheet.getCell("E24").value = { formula: "SUM(E8:E22)", result: totalAmount };
    sheet.getCell("E24").numFmt = currencyFormat;
    [3, 4, 5].forEach((column) => {
      const cell = sheet.getCell(24, column);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 12 };
      cell.alignment = { vertical: "middle", horizontal: column === 5 ? "right" : "center" };
    });
    sheet.getRow(24).height = 27;

    sheet.mergeCells("A26:E26");
    sheet.getCell("A26").value = "Generado por Cuenta Pesos · El conteo permanece almacenado localmente en el dispositivo.";
    sheet.getCell("A26").font = { italic: true, size: 9, color: { argb: "78847E" } };
    sheet.getCell("A26").alignment = { horizontal: "center" };
    sheet.getRow(26).height = 20;

    sheet.pageSetup.printArea = "A1:E26";
    sheet.headerFooter.oddFooter = "&LCuenta Pesos&C&F&R&P de &N";

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="corte-pesos-${localDate}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("No se pudo generar el corte de caja", error);
    return Response.json({ error: "No se pudo generar el archivo Excel." }, { status: 500 });
  }
}
