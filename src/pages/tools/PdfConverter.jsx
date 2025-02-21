// src/components/tools/PdfConverter.jsx
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import API_BASE_URL from "../../../api.config";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const PdfConverter = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedPreview, setSelectedPreview] = useState(null);

  // 🛎️ Show popup notifications
  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2500);
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Free PDF Converter | Convert Word, Excel, Images to PDF",
    "description": "Best free online PDF converter to convert Word, Excel, Markdown, and images to PDF. Merge, split, compress, and edit PDFs instantly with no sign-up required!",
    "url": "https://sms-coding.online/tools/pdf-converter",
    "publisher": {
      "@type": "sms-coding",
      "name": "sms-coding.online",
    },
    "hasPart": [
      {
        "@type": "SoftwareApplication",
        "name": "Word to PDF Converter",
        "url": "https://sms-coding.online/tools/pdf-converter"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Excel to PDF Converter",
        "url": "https://sms-coding.online/tools/pdf-converter"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Image to PDF Converter",
        "url": "https://sms-coding.online/tools/pdf-converter"
      }
    ]
  };
  // 🗂️ File Upload with Dropzone (Allow .MD and Case-Insensitive Extensions)
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xlsx"],
      "text/markdown": [".md", ".MD"],
      "image/jpeg": [".jpg", ".jpeg", ".JPEG",],
      "image/png": [".png"],
    },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(
          `Invalid file types: ${rejectedFiles.map((f) => f.name).join(", ")}`
        );
      }

      // ✅ Normalize Extensions (e.g., .MD to .md)
      const filteredFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx", "md", "jpg", "jpeg", "png",].includes(
          ext
        );
      });

      if (filteredFiles.length === 0) {
        showPopup("No valid files selected!");
        return;
      }

      setUploadedFiles(filteredFiles);
      showPopup(`${filteredFiles.length} valid file(s) selected`);
    },
  });

  // 🧩 Handle batch conversion
  const handleBatchConversion = async () => {
    if (uploadedFiles.length === 0) {
      showPopup("No files selected for conversion");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch(`${API_BASE_URL}/api/batch-convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Batch conversion failed");
      const results = await response.json();
      setBatchResults(results);
      showPopup("Batch conversion completed!");
    } catch (error) {
      console.error("Batch Conversion Error:", error);
      showPopup("Batch conversion failed");
    } finally {
      setLoading(false);
    }
  };

  // 📥 Download File from Base64 Properly
  const downloadFile = (base64String, filename) => {
    try {
      // ✅ Clean and normalize Base64
      const pureBase64 = base64String
        .replace(/\s/g, "") // Remove whitespace
        .replace(/^data:application\/pdf;base64,/, "") // Remove header
        .replace(/-/g, "+") // URL-safe to standard
        .replace(/_/g, "/");

      // ✅ Add padding if necessary (Base64 must be divisible by 4)
      const paddedBase64 = pureBase64.padEnd(
        pureBase64.length + ((4 - (pureBase64.length % 4)) % 4),
        "="
      );

      // ✅ Convert Base64 to binary
      const binary = Uint8Array.from(atob(paddedBase64), (char) =>
        char.charCodeAt(0)
      );

      // ✅ Create Blob from binary
      const blob = new Blob([binary], { type: "application/pdf" });

      // ✅ Create URL and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "converted.pdf";
      document.body.appendChild(a);
      a.click();

      // 🧹 Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error.message);
      alert("Failed to download the file. Please try again.");
    }
  };

  // ❌ Clear file selection
  const handleClearSelection = () => {
    setUploadedFiles([]);
    setBatchResults([]);
    setSelectedPreview(null);
    showPopup("Selection cleared");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white border rounded shadow"
    >
      <Helmet>
        {/* Meta Tags for SEO */}
        <title>Free PDF Converter | Convert Word, Excel, Images to PDF Online</title>
        <meta name="description" content="Use our free PDF converter to convert Word to PDF, Excel to PDF, images to PDF, and more. Merge, split, compress PDFs online instantly." />
        <meta name="keywords" content="free PDF converter, convert Word to PDF, Excel to PDF online, image to PDF, merge PDF files, split PDFs, compress PDF free, best online PDF tools" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Your Website Name" />

        {/* Open Graph (Social Sharing) */}
        <meta property="og:title" content="Free PDF Converter | Convert Word, Excel, Images to PDF" />
        <meta property="og:description" content="Convert Word, Excel, Markdown, and images to PDF for free. Merge, split, compress, and edit PDFs with no sign-up required!" />
        <meta property="og:url" content="https://sms-coding.online/tools/pdf-converter" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sms-coding.online/images/pdf-converter-banner.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free PDF Converter | Convert Word, Excel, Images to PDF" />
        <meta name="twitter:description" content="Convert files to PDF online for free. Supports Word, Excel, Images, and more!" />
        <meta name="twitter:image" content="https://sms-coding.online/images/pdf-converter-banner.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://sms-coding.online/tools/pdf-converter" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      {/* Header */}
      <h2 className="text-3xl font-bold text-blue-600 mb-4 text-center">
        Complete PDF Converter Tool
      </h2>
      <p className="text-center text-gray-500 mb-6">
        Convert DOCX, XLSX, Images, Markdown to PDF, merge or preview files.
      </p>

      {/* 🗂️ File Upload Dropzone */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-6 text-center cursor-pointer rounded-md mb-6 transition hover:bg-gray-50"
      >
        <input {...getInputProps()} />
        <p className="text-gray-600 dark:text-gray-400">
          Drag & drop files here, or click to select (DOCX, XLSX, MD, Images,
          PDF)
        </p>
      </div>

      {/* 📄 Show Selected Files */}
      {uploadedFiles.length > 0 && (
        <ul className="list-disc pl-5 mb-6">
          {uploadedFiles.map((file, idx) => (
            <li key={idx} className="text-sm text-gray-700">
              📄 {file.name}
            </li>
          ))}
        </ul>
      )}

      {/* 🧩 Conversion Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBatchConversion}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition ${
            loading ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          {loading ? "Converting..." : "Convert All to PDF"}
        </motion.button>

        {uploadedFiles.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearSelection}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Clear Selection
          </motion.button>
        )}
      </div>

      {/* Batch Conversion Results Section */}
      {batchResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Conversion Results</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batchResults.map((result, idx) => (
              <li key={idx} className="p-4 border rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{result.filename}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => downloadFile(result.base64, result.filename)}
                    className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition"
                  >
                    📥 Download
                  </motion.button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🖼️ PDF Preview Section */}
      {selectedPreview && (
        <div className="mt-6 border p-4 rounded-md bg-gray-100">
          <h3 className="text-lg font-semibold mb-2">PDF Preview:</h3>
          <div className="h-96 overflow-auto border">
            <Worker
              workerUrl={`https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.js`}
            >
              <Viewer
                fileUrl={`data:application/pdf;base64,${selectedPreview}`}
              />
            </Worker>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedPreview(null)}
            className="mt-4 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
          >
            Close Preview
          </motion.button>
        </div>
      )}

      {/* 🛎️ Popup Message */}
      {popupMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-4 p-2 bg-green-100 text-green-700 text-center rounded"
        >
          {popupMessage}
        </motion.div>
      )}

      {/* 🌀 Loading Spinner */}
      {loading && (
        <motion.div
          className="mt-4 text-center text-blue-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p>Converting...</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PdfConverter;
