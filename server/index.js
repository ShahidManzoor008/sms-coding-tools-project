// ============================
// 📂 Server: index.js
// ============================

const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { validateFileUpload } = require("./middleware/validate");
const helmet = require("helmet");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const mammoth = require("mammoth");
const XLSX = require("exceljs");
const { PDFDocument, rgb } = require("pdf-lib");
const rateLimit = require("express-rate-limit");
const markdownit = require("markdown-it");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  HeadingLevel,
} = require("docx");

const app = express();
const port = process.env.BACKEND_PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*";

// ============================
// 🛡️ Enable CORS and Security Middleware
// ============================
app.use(
  cors({
    origin: CORS_ORIGIN.split(","),
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(helmet());

// ============================
// 🛡️ Rate Limiting: 10 requests per minute per IP
// ============================
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ============================
// 🗂️ Configure Multer for File Uploads
// ============================
// Allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",  // ✅ Allow PDF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
    "application/vnd.ms-excel", 
    "image/jpeg",  // ✅ Allow JPG
    "image/png",   // ✅ Allow PNG
    "text/markdown",  // ✅ Allow Markdown (.md)
    "text/plain"  ,     // ✅ Some browsers use "text/plain" for .md files
    "application/octet-stream",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    console.error(`❌ Rejected file type: ${file.mimetype}`);
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: "uploads/", //
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ✅ Keep the correct extension
  },
});

// ✅ Use 'storage' instead of 'dest'
const upload = multer({
  storage,  // ✅ Storage configuration
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // ✅ 25MB max file size
});

// ============================
// ✅ File Upload API (Test Route)
// ============================
app.post("/api/test-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded!" });
  }
  res.json({ message: "File uploaded successfully!", file: req.file });
});

// ============================
// 🛡️ JSON Parsing Middleware (AFTER File Upload Routes)
// ============================
app.use(express.json());

// ============================
// 📂 Serve Static Files from React App
// ============================
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
// ============================
// 🧹 Helper Function: Cleanup Uploaded Files
// ============================
const cleanupFiles = (files) => {
  if (Array.isArray(files)) {
    files.forEach((file) => fs.unlinkSync(file.path));
  } else {
    fs.unlinkSync(files.path);
  }
};

// ============================
// 📝 Helper Function: Convert DOCX to PDF (Images, Tables, Styles)
// ============================
const convertDocxToPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  // Convert DOCX to HTML using mammoth
  const { value: html } = await mammoth.convertToHtml({ buffer });
  // Render HTML with Puppeteer for PDF
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const styledHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          img { max-width: 100%; height: auto; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 5px; }
          h1, h2, h3 { margin-top: 20px; }
          p { line-height: 1.5; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        ${html || "<p>No content found in DOCX</p>"}
      </body>
    </html>
  `;
  await page.setContent(styledHtml, { waitUntil: "domcontentloaded" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      bottom: "20px",
      left: "20px",
      right: "20px",
    },
  });
  await browser.close();
  return pdfBuffer;
};
// ============================
// 🧮 Helper Function: Convert XLSX to PDF
// ============================
const convertXlsxToPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const workbook = new XLSX.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  let content = "";
  worksheet.eachRow((row) => {
    content += row.values.join(" | ") + "\n";
  });
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  page.drawText(content, { x: 50, y: 750, size: 10 });

  return Buffer.from(await pdfDoc.save());
};
// ============================
// 📝 Helper Function: Convert Markdown to PDF
// ============================
const convertMarkdownToPDF = async (filePath) => {
  const markdown = fs.readFileSync(filePath, "utf-8");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(`<html><body><pre>${markdown}</pre></body></html>`);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
};
// ============================
// 🖼️ Helper Function: Convert Image (PNG/JPG) to PDF
// ============================
const convertImageToPDF = async (filePath) => {
  const imageBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const extension = path.extname(filePath).toLowerCase();
  const image =
    extension === ".png"
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: 600,
    height: 800,
  });

  return Buffer.from(await pdfDoc.save());
};

// ============================
// 🧩 Helper Function: Convert Files to PDF for Batch Mode
// ============================
const convertFileToPDF = async (filePath, fileType) => {
  if (fileType === "docx") return await convertDocxToPDF(filePath);
  if (fileType === "xlsx") return await convertXlsxToPDF(filePath);
  if (["png", "jpg", "jpeg",].includes(fileType))
    return await convertImageToPDF(filePath);
  if (fileType === "md") return await convertMarkdownToPDF(filePath);
  throw new Error(`Unsupported file type: ${fileType}`);
};
// ============================
// 📝 Helper Function: Convert Markdown to DOCX 
// ============================
const convertMarkdownToDocx = async (filePath) => {
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const md = markdownit();
  const htmlContent = md.render(mdContent);
  // Helper: Create Paragraph
  const createParagraph = (text, { bold = false, italic = false, bullet = false, heading = null } = {}) => {
    return new Paragraph({
      children: [new TextRun({ text, bold, italics: italic, size: 24 })],
      bullet: bullet ? { level: 0 } : undefined,
      heading,
      spacing: { after: 200 },
    });
  };
  // Helper: Create Table from Markdown
  const createTable = (rows) => {
    const tableRows = rows.map((row) => {
      const cells = row.split('|').filter(Boolean).map((cell) => (
        new TableCell({
          children: [new Paragraph(cell.trim())],
          width: { size: 2500, type: WidthType.DXA },
        })
      ));
      return new TableRow({ children: cells });
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  };
  // 📝 Parse Markdown Content
  let tableRows = [];
  const docContent = [];
  // Add Document Title
  docContent.push(
    new Paragraph({
      children: [new TextRun({ text: '📄 MarkdownToDOCX sms-coding', bold: true, size: 32 })],
      alignment: "center",
      spacing: { after: 300 },
    })
  );
  // Parse Markdown Content into DOCX
  htmlContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    // Tables
    if (line.startsWith('|') && line.includes('|')) {
      tableRows.push(line);
    } else {
      if (tableRows.length > 0) {
        docContent.push(createTable(tableRows));
        tableRows = [];
      }
      // Headings
      if (trimmed.startsWith('<h1>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_1 }));
      } else if (trimmed.startsWith('<h2>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_2 }));
      } else if (trimmed.startsWith('<h3>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_3 }));
      }
      // Lists
      else if (/^(\*|-)\s+/.test(trimmed)) {
        docContent.push(createParagraph(stripHtml(trimmed.replace(/^(\*|-)\s+/, '')), { bullet: true }));
      }
      // Paragraphs
      else if (trimmed !== '') {
        docContent.push(createParagraph(stripHtml(trimmed)));
      }
      // Blank Line
      else {
        docContent.push(new Paragraph({}));
      }
    }
  });
  // Add Remaining Table if Present
  if (tableRows.length) {
    docContent.push(createTable(tableRows));
  }
  // 📄 Create DOCX with Sections Immediately 
  const doc = new Document({
    creator: "Markdown Converter Tool",
    title: "Markdown to DOCX Document",
    description: "Converted from a Markdown file",
    sections: [
      {
        properties: {},
        children: docContent,
      },
    ],
  });
  // ✅ Generate DOCX Buffer
  return await Packer.toBuffer(doc);
};

// ============================
// Helper: Strip HTML Tags
// ============================
const stripHtml = (str) => str.replace(/<\/?[^>]+(>|$)/g, '');

// ============================
// 📂 API: Convert Markdown to DOCX
// ============================
app.post('/api/convert-md-to-docx', upload.single('file'), async (req, res) => {
  try {
    console.log('📝 Received Markdown file:', req.file.originalname);
    const docxBuffer = await convertMarkdownToDocx(req.file.path);
    cleanupFiles(req.file);
    console.log('✅ Markdown converted to DOCX successfully');

    res.setHeader('Content-Disposition', 'attachment; filename="converted-markdown.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docxBuffer);
  } catch (error) {
    console.error('❌ Markdown to DOCX Error:', error.stack);
    res.status(500).json({ error: `Failed to convert Markdown to DOCX: ${error.message}` });
  }
});

// ============================
// 🧩 API: Batch Conversion for Multiple Files
// ============================
app.post("/api/batch-convert", upload.array("files", 5),validateFileUpload, async (req, res) => {
  try {
    const results = [];
    for (const file of req.files) {
      const extension = path
        .extname(file.originalname)
        .toLowerCase()
        .replace(".", "");
      const pdfBuffer = await convertFileToPDF(file.path, extension);
      // ✅ Use Buffer.from for clean Base64 response
      results.push({
        filename: file.originalname.replace(/\.[^/.]+$/, "") + ".pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"), // Clean Base64
      });
    }
    cleanupFiles(req.files);
    res.json(results);
  } catch (error) {
    console.error("Batch Conversion Error:", error.message);
    res
      .status(500)
      .json({ error: `Batch conversion failed: ${error.message}` });
  }
});

// ============================
// 📄 API: Convert Single DOCX to PDF
// ============================
app.post("/api/convert-docx", upload.single("file"), validateFileUpload, async (req, res) => {
  try {
    const pdfBuffer = await convertDocxToPDF(req.file.path);
    cleanupFiles(req.file);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="converted-docx.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("DOCX Conversion Error:", error.message);
    res.status(500).json({ error: `Failed to convert DOCX: ${error.message}` });
  }
});

// ============================
// 📊 API: Convert Single XLSX to PDF
// ============================
app.post("/api/convert-xlsx", upload.single("file"),validateFileUpload, async (req, res) => {
  try {
    const pdfBuffer = await convertXlsxToPDF(req.file.path);
    cleanupFiles(req.file);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="converted-xlsx.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("XLSX Conversion Error:", error.message);
    res.status(500).json({ error: `Failed to convert XLSX: ${error.message}` });
  }
});

// ============================
// 📝 API: Convert Single Markdown to PDF
// ============================
app.post("/api/convert-markdown", upload.single("file"),validateFileUpload, async (req, res) => {
  try {
    const pdfBuffer = await convertMarkdownToPDF(req.file.path);
    cleanupFiles(req.file);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="converted-markdown.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Markdown Conversion Error:", error.message);
    res
      .status(500)
      .json({ error: `Failed to convert Markdown: ${error.message}` });
  }
});

// ============================
// 🚀 Start Backend Server
// ============================
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
