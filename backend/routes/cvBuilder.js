import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pdfMake from "pdfmake";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const cvsDir = path.join(__dirname, "../uploads/cvs");
if (!fs.existsSync(cvsDir)) {
  fs.mkdirSync(cvsDir, { recursive: true });
}

const fontsDir = path.join(__dirname, "../node_modules/pdfmake/fonts/Roboto");
pdfMake.setFonts({
  Roboto: {
    normal: path.join(fontsDir, "Roboto-Regular.ttf"),
    bold: path.join(fontsDir, "Roboto-Medium.ttf"),
    italics: path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  },
});

const ACCENT = "#2F4C81";
const MUTED = "#6b7280";

function buildDocDefinition(data) {
  const {
    full_name,
    email,
    phone,
    degree,
    university,
    gpa,
    summary,
    skills = [],
    experience = [],
  } = data;

  const contactLine = [email, phone, university].filter(Boolean).join("   •   ");

  const content = [
    { text: full_name || "Untitled", style: "name" },
    contactLine ? { text: contactLine, style: "contact", margin: [0, 4, 0, 0] } : null,
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }], margin: [0, 14, 0, 14] },
  ];

  if (summary) {
    content.push({ text: "Summary", style: "sectionHeader" });
    content.push({ text: summary, style: "body", margin: [0, 4, 0, 14] });
  }

  if (degree || gpa) {
    content.push({ text: "Education", style: "sectionHeader" });
    content.push({
      columns: [
        { text: degree || "", style: "body" },
        gpa ? { text: `GPA: ${gpa}`, style: "body", alignment: "right" } : {},
      ],
      margin: [0, 4, 0, 14],
    });
  }

  if (skills.length > 0) {
    content.push({ text: "Skills", style: "sectionHeader" });
    content.push({
      text: skills.join("   •   "),
      style: "body",
      margin: [0, 4, 0, 14],
    });
  }

  if (experience.length > 0) {
    content.push({ text: "Experience", style: "sectionHeader" });
    experience.forEach((exp, i) => {
      content.push({
        columns: [
          { text: exp.title || "", style: "expTitle" },
          { text: exp.duration || "", style: "contact", alignment: "right" },
        ],
        margin: [0, i === 0 ? 4 : 10, 0, 0],
      });
      if (exp.company) content.push({ text: exp.company, style: "expCompany" });
      if (exp.description) content.push({ text: exp.description, style: "body", margin: [0, 2, 0, 0] });
    });
  }

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: "Roboto", fontSize: 10.5, color: "#1e293b" },
    content: content.filter(Boolean),
    styles: {
      name: { fontSize: 24, bold: true, color: ACCENT },
      contact: { fontSize: 9.5, color: MUTED },
      sectionHeader: { fontSize: 12, bold: true, color: ACCENT, margin: [0, 0, 0, 2] },
      body: { fontSize: 10.5, color: "#1e293b", lineHeight: 1.3 },
      expTitle: { fontSize: 11, bold: true },
      expCompany: { fontSize: 10, italics: true, color: MUTED, margin: [0, 1, 0, 0] },
    },
  };
}

// Generate a CV PDF from structured form data (for students without an existing CV file)
router.post("/generate", async (req, res) => {
  try {
    const { full_name, email } = req.body || {};

    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: "full_name and email are required",
      });
    }

    const docDefinition = buildDocDefinition(req.body);
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `cv-builder-${uniqueSuffix}.pdf`;
    fs.writeFileSync(path.join(cvsDir, filename), buffer);

    const filePath = `/uploads/cvs/${filename}`;
    console.log("✅ CV generated from builder:", filePath);

    res.status(200).json({
      success: true,
      message: "CV generated successfully",
      filePath,
    });
  } catch (error) {
    console.error("CV builder generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CV",
    });
  }
});

export default router;
