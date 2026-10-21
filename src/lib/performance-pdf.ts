import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { bestBySubject, fmt, nameWithSex, type SheetRow } from "./sheet";

type Options = {
  title: string;
  subtitle: string;
  columns: { name: string }[];
  rows: SheetRow[];
  gradeScale: string;
};

/** A landscape A4 performance sheet, plus a second table of the best students in each subject. */
export function buildSheetPdf({ title, subtitle, columns, rows, gradeScale }: Options): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(15);
  doc.setTextColor(20, 33, 61);
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(subtitle, 14, 20);

  const small = columns.length > 10;
  const fixed = 4; // position, name, admission number, class
  const numeric = Object.fromEntries(Array.from({ length: columns.length + 2 }, (_, i) => [fixed + i, { halign: "center" as const }]));

  autoTable(doc, {
    startY: 25,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [["Pos", "Name", "Adm No", "Class", ...columns.map((c) => c.name), "Total", "Average", "Grade"]],
    body: rows.map((r) => [
      r.position, nameWithSex(r) + (r.incomplete ? " *" : ""), r.admissionNo, r.className,
      ...r.scores.map(fmt), fmt(r.total), `${fmt(r.mean)}%`, r.grade,
    ]),
    styles: { fontSize: small ? 6.5 : 8, cellPadding: small ? 1.2 : 1.6, textColor: 30 },
    headStyles: { fillColor: [20, 33, 61], textColor: 255, halign: "center", valign: "middle" },
    alternateRowStyles: { fillColor: [244, 246, 250] },
    columnStyles: { 0: { halign: "center", fontStyle: "bold" }, ...numeric, [fixed + columns.length]: { halign: "center", fontStyle: "bold" }, [fixed + columns.length + 1]: { halign: "center", fontStyle: "bold" } },
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: [0, 1],
  });

  doc.addPage();
  doc.setFontSize(13);
  doc.setTextColor(20, 33, 61);
  doc.text("Best student in each subject", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(subtitle, 14, 20);

  const cell = (top: { position: number; name: string; className: string; score: number }[], pos: number) =>
    top.filter((t) => t.position === pos).map((t) => `${t.name}, ${t.className}: ${fmt(t.score)}`).join("\n");

  autoTable(doc, {
    startY: 25,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [["Subject", "1st", "2nd", "3rd"]],
    body: bestBySubject(rows, columns, 3).map((b) => [b.subject, cell(b.top, 1), cell(b.top, 2), cell(b.top, 3)]),
    styles: { fontSize: 8, cellPadding: 1.6, textColor: 30, valign: "top" },
    headStyles: { fillColor: [20, 33, 61], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 36 } },
  });

  const pages = doc.getNumberOfPages();
  const made = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.text(`Grades: ${gradeScale}.`, 14, 198.5);
    doc.text("* marks entered for fewer subjects than classmates.", 14, 202.5);
    doc.text(`Page ${i} of ${pages}   ${made}`, 283, 203, { align: "right" });
  }
  return doc;
}
