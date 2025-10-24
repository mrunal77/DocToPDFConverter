import React, { useState, useRef } from 'react'

export default function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const accept = '.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'

  function onFileSelect(e) {
    setError(null)
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setFile(f)
    setStatus('ready')
    setProgress(0)
  }

  async function convert() {
    if (!file) return setError('Please select a file to convert')
    setError(null)
    setStatus('uploading')
    setProgress(10)

    const form = new FormData()
    form.append('file', file)

    try {
      const resp = await fetch('http://localhost:4000/convert', {
        method: 'POST',
        body: form
      })

      if (!resp.ok) {
        const json = await resp.json().catch(()=>null)
        throw new Error(json?.error || `Server returned ${resp.status}`)
      }

      const blob = await resp.blob()
      setProgress(90)
      // trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const name = file.name.replace(/\.[^.]+$/, '') + '.pdf'
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setProgress(100)
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
      setProgress(0)
    }
  }

  function reset() {
    setFile(null)
    setStatus('')
    setProgress(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="d-flex align-items-center mb-4">
                <div className="fs-1 text-primary me-3"><i className="fas fa-file-pdf"></i></div>
                <div>
                  <h2 className="card-title mb-0">Document to PDF</h2>
                  <p className="text-muted mb-0">Convert Word, Excel or PowerPoint files to beautiful PDFs.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Select file</label>
                <input ref={inputRef} type="file" accept={accept} className="form-control" onChange={onFileSelect} />
                <div className="form-text">Supported: .doc .docx .xls .xlsx .ppt .pptx</div>
              </div>

              {file && (
                <div className="mb-3">
                  <strong>Selected:</strong> {file.name} • {(file.size/1024/1024).toFixed(2)} MB
                </div>
              )}

              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={convert} disabled={!file || status==='uploading'}>
                  <i className="fas fa-file-export me-2"></i> Convert to PDF
                </button>
                <button className="btn btn-outline-secondary" onClick={reset}>
                  <i className="fas fa-undo me-2"></i> Reset
                </button>
                <a className="btn btn-link ms-auto" href="#" onClick={(e)=>{e.preventDefault(); alert('This converter uses LibreOffice on the server to perform high-quality conversions.')}}>
                  <i className="fas fa-info-circle me-1"></i> How it works
                </a>
              </div>

              {status && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Status: {status}</small>
                    <small className="text-muted">{progress}%</small>
                  </div>
                  <div className="progress" style={{height: '10px'}}>
                    <div className="progress-bar" role="progressbar" style={{width: `${progress}%`}} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-4">{error}</div>
              )}

              <hr className="my-4" />

              <div className="text-muted small">
                Note: This demo expects the server to have LibreOffice installed. See server README for install instructions.
              </div>
            </div>
          </div>

          <div className="text-center mt-4 text-muted small">Made with <i className="fas fa-heart text-danger"></i> • Bootstrap • Font Awesome</div>
        </div>
      </div>
    </div>
  )
}
