import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Popup from "../../components/Popup";

const UrlTool = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  const handleEncode = () => {
    try {
      setResult(encodeURIComponent(text)); // Encode URL
      setError("");
    } catch (err) {
      setError("Encoding failed. Please check your input.");
      setResult("");
    }
  };

  const handleDecode = () => {
    try {
      setResult(decodeURIComponent(text)); // Decode URL
      setError("");
    } catch (err) {
      setError("Decoding failed. Invalid URL encoding.");
      setResult("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showPopup("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "url_output.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showPopup("File downloaded!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Helmet>
  <title>Free URL Encoder & Decoder - Convert URLs Online</title>
  <meta name="description" content="Easily encode or decode URLs with our Free Online URL Encoder & Decoder. Perfect for web developers, marketers, and SEO professionals!" />
  <meta name="keywords" content="URL encoder, URL decoder, free URL converter, online URL encoding tool, decode URLs, free SEO tools, developer tools, no signup" />
  <meta property="og:title" content="Free URL Encoder & Decoder - Convert URLs Online" />
  <meta property="og:description" content="Easily encode or decode URLs with our Free Online URL Encoder & Decoder. Perfect for web developers, marketers, and SEO professionals!" />
  <meta property="og:url" content="https://sms-coding.online/tools/url-encoder" />
  <meta property="og:type" content="website" />
</Helmet>

      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
        URL Encoder/Decoder
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
        Encode or decode URLs safely.
      </p>

      {/* Input Textarea */}
      <textarea
        className="w-full h-40 p-3 mt-6 border rounded-md dark:bg-gray-800 dark:text-white"
        placeholder="Enter text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>

      {/* Encode & Decode Buttons */}
      <div className="flex gap-4 mt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEncode}
          className="w-1/2 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
        >
          Encode
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDecode}
          className="w-1/2 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
        >
          Decode
        </motion.button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-3">{error}</p>}

      {/* Output Result */}
      {result && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md relative">
          <h2 className="text-xl font-semibold">Result:</h2>
          <pre className="mt-2 text-gray-800 dark:text-gray-200 overflow-auto">{result}</pre>

          {/* Copy & Download Buttons */}
          <div className="flex gap-4 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
              Copy
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition"
            >
              Download
            </motion.button>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </motion.div>
  );
};

export default UrlTool;
