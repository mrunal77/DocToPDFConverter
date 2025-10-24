# ToPDFConverter

This repository contains a simple full-stack app to convert Word, Excel and PowerPoint files to PDF.

Structure:
- `server/`: Express backend which accepts file uploads and calls LibreOffice headless to convert files to PDF.
- `client/`: Vite + React frontend with a clean Bootstrap UI to upload a file and download the converted PDF.

Prerequisites:
- Node.js >=16
- npm or yarn
- LibreOffice installed on the machine where the server runs (conversion is done with `libreoffice --headless --convert-to pdf`).

Quick start (from project root):

1. Install server deps

```bash
cd server
npm install
```

2. Install client deps

```bash
cd ../client
npm install
```

3. Start server

```bash
cd ../server
npm start
```

4. Start client (in another terminal)

```bash
cd client
npm run dev
```

Open the client at the address printed by Vite (usually http://localhost:5173) and use the UI to upload a document and convert it.

Notes:
- Ensure LibreOffice is installed on your system. On Debian/Ubuntu: `sudo apt update && sudo apt install -y libreoffice`
- The server will try to delete temporary files after conversion.
- This is a local demo; for a production deployment consider containerizing the server and validating inputs, scanning for viruses, adding rate-limits and authentication.
