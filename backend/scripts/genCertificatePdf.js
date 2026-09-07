import pdfMake from "pdfmake";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, "..", "node_modules", "pdfmake", "fonts", "Roboto");

pdfMake.setFonts({
  Roboto: {
    normal: path.join(fontsDir, "Roboto-Regular.ttf"),
    bold: path.join(fontsDir, "Roboto-Medium.ttf"),
    italics: path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  },
});

const docDefinition = {
  pageSize: "A4",
  pageMargins: [60, 80, 60, 60],
  content: [
    { text: "Certificate of Internship Completion", style: "title", alignment: "center" },
    { text: " ", margin: [0, 10] },
    { text: "This certifies that", alignment: "center", fontSize: 12, color: "#5B6478" },
    { text: "Hadi Qawasmi", style: "name", alignment: "center", margin: [0, 8, 0, 8] },
    {
      text: "has successfully completed the Frontend Developer Intern program at MedTech Solutions.",
      alignment: "center", fontSize: 12, margin: [40, 0, 40, 20],
    },
    {
      columns: [
        { text: "Overall Rating: 8.80 / 10", alignment: "center", fontSize: 11, bold: true },
      ],
    },
    { text: " ", margin: [0, 20] },
    {
      columns: [
        { text: "Suhail Barghouti\nTrainer, MedTech Solutions", alignment: "center", fontSize: 10, color: "#5B6478" },
        { text: "MedTech Solutions\nCareers Team", alignment: "center", fontSize: 10, color: "#5B6478" },
      ],
    },
    { text: " ", margin: [0, 20] },
    { text: "Issued: September 7, 2026", alignment: "center", fontSize: 9, color: "#93A0BE" },
  ],
  styles: {
    title: { fontSize: 22, bold: true, color: "#2F4C81" },
    name: { fontSize: 18, bold: true, color: "#12182A" },
  },
  defaultStyle: { font: "Roboto" },
};

const outPath = path.join(__dirname, "hadi-certificate.pdf");
const pdfDoc = pdfMake.createPdf(docDefinition);
await pdfDoc.write(outPath);
console.log("saved:", outPath);
