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

Docker / deployment notes
------------------------

This server requires the LibreOffice binary to be present on the host to perform conversions. That means serverless platforms which do not allow installing system packages or running native binaries (for example Vercel serverless functions) are not suitable for this app.

Recommended approach: build and deploy the server as a Docker container. The included `Dockerfile` installs LibreOffice and runs the Node app. Example platforms that support this setup: Render, Fly.io, Railway (Docker), DigitalOcean App Platform, or any container host / Kubernetes cluster.

Local container quickstart:

```bash
# build the image
docker build -t topdf-server ./server

# run the container
docker run -p 4000:4000 --name topdf-server -d topdf-server

# or with docker-compose (root of repo)
docker-compose up --build
```

After the container is running, the server will be available on port 4000 of the host.

Why not Vercel?
- Vercel serverless functions run on ephemeral serverless runtimes without the ability to install persistent system packages like LibreOffice. Because this project depends on the LibreOffice binary, it must run on a container or VM where you can install that software.

If you'd like, I can:

- Add a `Dockerfile` (done) and a small guide to deploy to a specific provider such as Render or Fly.io (I can add provider-specific config files).
- Add a Healthcheck endpoint and a small `Procfile` or `systemd` service to run the server on a VM.

