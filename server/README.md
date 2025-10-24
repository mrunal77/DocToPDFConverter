# Server (ToPDFConverter)

This Express server receives a file via `/convert` and uses LibreOffice headless mode to convert it to PDF. It returns the PDF as a download.

Important: LibreOffice must be installed on the server host. On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y libreoffice
```

Install dependencies and run:

```bash
cd server
npm install
npm start
```

By default the server listens on port 4000. You can change it by setting the `PORT` env var.

Files:
- `index.js` - main server implementation
- `uploads/` - temporary uploaded files
- `out/` - generated PDFs (deleted after sending)

Security notes:
- This demo does minimal validation. For production, validate uploads, enforce file size limits, scan uploads for malware, and consider running conversions in an isolated container or sandbox.
