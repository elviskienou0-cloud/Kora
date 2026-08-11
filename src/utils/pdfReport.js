import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const GOLD_COLOR = [212, 175, 55];
const GOLD_DARK = [184, 134, 11];
const TEXT_DARK = [60, 45, 20];
const TEXT_MUTED = [130, 110, 85];
const BG_LIGHT = [255, 252, 245];

export async function generatePDFReport(elementId, options = {}) {
  const {
    filename = "rapport-kora.pdf",
    title = "Rapport Kora",
    subtitle = "",
    includeHeader = true,
    includeFooter = true,
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element non trouvé:", elementId);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    if (includeHeader) {
      addGoldHeader(pdf, title, subtitle, margin, pageWidth);
      position = 35;
      heightLeft -= position - margin;
    }

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - position - margin;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      if (includeHeader) {
        addGoldHeader(pdf, title, subtitle, margin, pageWidth);
        position = Math.max(position, 35);
      }
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - (includeHeader ? 35 : 0) - margin;
    }

    if (includeFooter) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addGoldFooter(pdf, i, totalPages, pageWidth, pageHeight);
      }
    }

    pdf.save(filename);
    return pdf;
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    throw error;
  }
}

function addGoldHeader(pdf, title, subtitle, margin, pageWidth) {
  pdf.setFillColor(...GOLD_COLOR);
  pdf.rect(margin, margin - 6, pageWidth - margin * 2, 28, "F");

  pdf.setFillColor(...BG_LIGHT);
  pdf.rect(margin + 2, margin - 4, pageWidth - margin * 2 - 4, 24, "F");

  pdf.setTextColor(...TEXT_DARK);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, margin + 8, margin + 7);

  if (subtitle) {
    pdf.setTextColor(...GOLD_DARK);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(subtitle, margin + 8, margin + 16);
  }

  pdf.setTextColor(...GOLD_DARK);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "italic");
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  pdf.text(date, pageWidth - margin - 8, margin + 7, { align: "right" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...GOLD_DARK);
  pdf.text("KORA", pageWidth - margin - 8, margin + 16, { align: "right" });
}

function addGoldFooter(pdf, currentPage, totalPages, pageWidth, pageHeight) {
  const margin = 14;

  pdf.setDrawColor(...GOLD_COLOR);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

  pdf.setTextColor(...TEXT_MUTED);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "© Kora - Plateforme de talents africains",
    margin,
    pageHeight - 10
  );

  pdf.setTextColor(...GOLD_DARK);
  pdf.setFont("helvetica", "bold");
  pdf.text(
    `Page ${currentPage} / ${totalPages}`,
    pageWidth - margin,
    pageHeight - 10,
    { align: "right" }
  );
}

export function generateTalentListPDF(talents, options = {}) {
  const {
    filename = "liste-talents.pdf",
    title = "Liste des Talents",
  } = options;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const colWidths = [8, 50, 40, 35, 40];
  const startY = 40;
  const rowHeight = 10;

  addGoldHeader(pdf, title, `${talents.length} talents référencés`, margin, pageWidth);

  let currentY = startY;

  pdf.setFillColor(...GOLD_COLOR);
  pdf.rect(margin, currentY, pageWidth - margin * 2, rowHeight, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");

  const headers = ["#", "Nom & Prénom", "Catégorie", "Pays", "Email"];
  let currentX = margin + 2;
  headers.forEach((header, i) => {
    pdf.text(header, currentX, currentY + 6.5);
    currentX += colWidths[i];
  });
  currentY += rowHeight;

  talents.forEach((talent, index) => {
    if (currentY + rowHeight > pageHeight - 25) {
      addGoldFooter(pdf, pdf.internal.getNumberOfPages(), pdf.internal.getNumberOfPages(), pageWidth, pageHeight);
      pdf.addPage();
      addGoldHeader(pdf, title, `${talents.length} talents référencés`, margin, pageWidth);
      currentY = startY;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(255, 252, 245);
      pdf.rect(margin, currentY, pageWidth - margin * 2, rowHeight, "F");
    }

    pdf.setTextColor(...TEXT_DARK);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    currentX = margin + 2;
    const row = [
      String(index + 1),
      `${talent.lastName || ""} ${talent.firstName || ""}`.trim(),
      talent.category || "",
      talent.country || "",
      talent.email || "",
    ];
    row.forEach((cell, i) => {
      pdf.text(String(cell).substring(0, 25), currentX, currentY + 6.5);
      currentX += colWidths[i];
    });
    currentY += rowHeight;
  });

  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addGoldFooter(pdf, i, totalPages, pageWidth, pageHeight);
  }

  pdf.save(filename);
  return pdf;
}

export function generateFinancialReportPDF(data, options = {}) {
  const {
    filename = "rapport-financier.pdf",
    title = "Rapport Financier",
    subtitle = "",
  } = options;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const startY = 40;
  let currentY = startY;

  addGoldHeader(pdf, title, subtitle, margin, pageWidth);

  if (data.summary) {
    pdf.setTextColor(...TEXT_DARK);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Résumé", margin, currentY);
    currentY += 8;

    const summaryItems = data.summary || [];
    summaryItems.forEach((item, idx) => {
      if (idx % 3 === 0 && idx > 0) {
        currentY += 2;
      }
      const col = idx % 3;
      const cardWidth = (pageWidth - margin * 2 - 10) / 3;
      const cardX = margin + col * (cardWidth + 5);

      pdf.setFillColor(...GOLD_COLOR);
      pdf.rect(cardX, currentY, cardWidth, 22, "F");
      pdf.setFillColor(255, 255, 255);
      pdf.rect(cardX + 1, currentY + 1, cardWidth - 2, 20, "F");

      pdf.setTextColor(...GOLD_DARK);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(item.label, cardX + 4, currentY + 8);

      pdf.setTextColor(...TEXT_DARK);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(item.value, cardX + 4, currentY + 17);

      if (col === 2) currentY += 26;
    });
    currentY += 10;
  }

  if (data.rows) {
    pdf.setTextColor(...TEXT_DARK);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Détails des transactions", margin, currentY);
    currentY += 8;

    const tableStartY = currentY;
    const colWidths = [25, 70, 35, 35];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = (pageWidth - tableWidth) / 2;

    pdf.setFillColor(...GOLD_DARK);
    pdf.rect(tableX, currentY, tableWidth, 9, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");

    const tx = tableX + 2;
    pdf.text("Date", tx, currentY + 6);
    pdf.text("Description", tx + colWidths[0], currentY + 6);
    pdf.text("Montant (XOF)", tx + colWidths[0] + colWidths[1], currentY + 6, { align: "right" });
    pdf.text("Statut", tx + colWidths[0] + colWidths[1] + colWidths[2], currentY + 6, { align: "center" });
    currentY += 9;

    data.rows.forEach((row, i) => {
      if (currentY + 8 > pageHeight - 25) {
        addGoldFooter(pdf, pdf.internal.getNumberOfPages(), pdf.internal.getNumberOfPages(), pageWidth, pageHeight);
        pdf.addPage();
        addGoldHeader(pdf, title, subtitle, margin, pageWidth);
        currentY = startY;
      }

      if (i % 2 === 0) {
        pdf.setFillColor(255, 252, 245);
        pdf.rect(tableX, currentY, tableWidth, 8, "F");
      }

      pdf.setTextColor(...TEXT_DARK);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(row.date || "", tx, currentY + 5.5);
      pdf.text(String(row.description || "").substring(0, 35), tx + colWidths[0], currentY + 5.5);
      pdf.text(String(row.amount || ""), tx + colWidths[0] + colWidths[1] + colWidths[2] - 2, currentY + 5.5, { align: "right" });

      const statusX = tx + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2;
      pdf.setTextColor(...(row.status === "Payé" ? [34, 139, 34] : row.status === "En attente" ? GOLD_DARK : [180, 40, 40]));
      pdf.setFont("helvetica", "bold");
      pdf.text(row.status || "", statusX, currentY + 5.5, { align: "center" });
      currentY += 8;
    });
  }

  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addGoldFooter(pdf, i, totalPages, pageWidth, pageHeight);
  }

  pdf.save(filename);
  return pdf;
}
