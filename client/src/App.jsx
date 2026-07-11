// Client-side document-to-PDF converter
// Libraries: pdfmake (PDF gen), mammoth.js (.docx), SheetJS (.xls/.xlsx), JSZip (.pptx)
// No server needed - works entirely in the browser

import { useState, useRef } from 'react'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'

// Register pdfmake font data (bundled Roboto)
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs

const SUPPORTED = {
  docx: 'Word (.docx)',
  xlsx: 'Excel (.xlsx)',
  xls: 'Excel (.xls)',
  pptx: 'PowerPoint (.pptx)'
}

export default function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const accept = '.docx,.xls,.xlsx,.pptx'

  function ext(f) {
    return f.name.split('.').pop().toLowerCase()
  }

  function onFileSelect(e) {
    setError(null)
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setFile(f)
    setStatus('ready')
    setProgress(0)
  }

  async function convertDocx(buf) {
    const result = await mammoth.convertToHtml({ arrayBuffer: buf })
    return result.value
  }

  async function convertXlsx(buf) {
    const wb = XLSX.read(buf, { type: 'array' })
    let html = ''
    wb.SheetNames.forEach(name => {
      const sheet = wb.Sheets[name]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      if (!data.length) return
      html += `<h3>${name}</h3><table border="1" cellpadding="4" style="border-collapse:collapse;width:100%">`
      data.forEach(row => {
        html += '<tr>' + row.map(c => `<td>${c ?? ''}</td>`).join('') + '</tr>'
      })
      html += '</table><br/>'
    })
    return html || '<p>(Empty spreadsheet)</p>'
  }

  async function convertPptx(buf) {
    const zip = await JSZip.loadAsync(buf)
    const slideFiles = Object.keys(zip.files)
      .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort()
    let content = ''
    for (const sf of slideFiles) {
      const xml = await zip.files[sf].async('string')
      const texts = [...xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
        .map(m => m[1])
        .filter(t => t.trim())
      if (texts.length) content += texts.join(' ') + '\n\n'
    }
    return content || '(No text content found in slides)'
  }

  // Convert mammoth/SheetJS HTML output into pdfmake content blocks
  function htmlToContent(html) {
    const div = document.createElement('div')
    div.innerHTML = html
    const content = []
    for (const node of div.childNodes) {
      if (node.nodeType === 3) {
        const t = node.textContent.trim()
        if (t) content.push({ text: t, margin: [0, 2, 0, 2] })
      } else if (node.tagName === 'H3') {
        content.push({ text: node.textContent, style: 'header' })
      } else if (node.tagName === 'P') {
        content.push({ text: node.textContent, margin: [0, 2, 0, 2] })
      } else if (node.tagName === 'TABLE') {
        const rows = []
        for (const tr of node.querySelectorAll('tr')) {
          const row = []
          for (const td of tr.querySelectorAll('td')) {
            row.push({ text: td.textContent })
          }
          rows.push(row)
        }
        if (rows.length) {
          content.push({
            table: { body: rows },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 5]
          })
        }
      }
    }
    return content
  }

  async function convert() {
    if (!file) return setError('Please select a file to convert')
    setError(null)
    setStatus('converting')
    setProgress(10)

    try {
      const e = ext(file)
      if (!SUPPORTED[e]) {
        if (e === 'doc' || e === 'ppt') {
          throw new Error(`${e.toUpperCase()} format is not supported in browser. Please convert to .docx or .pptx first.`)
        }
        throw new Error(`Unsupported format: .${e}`)
      }

      const buf = await file.arrayBuffer()
      setProgress(30)

      let content

      switch (e) {
        case 'docx': {
          const html = await convertDocx(buf)
          content = htmlToContent(html)
          break
        }
        case 'xls':
        case 'xlsx': {
          const html = await convertXlsx(buf)
          content = htmlToContent(html)
          break
        }
        case 'pptx': {
          const text = await convertPptx(buf)
          content = text.split('\n')
            .filter(l => l.trim())
            .map(l => ({ text: l.trim(), margin: [0, 4, 0, 4] }))
          break
        }
      }

      if (!content || content.length === 0) {
        throw new Error('No content could be extracted from the file')
      }

      setProgress(70)

      // Build pdfmake document definition from extracted content
      const docDefinition = {
        info: {
          title: file.name,
          author: 'DocToPDFConverter'
        },
        content: [
          { text: file.name.replace(/\.[^.]+$/, ''), style: 'title', margin: [0, 0, 0, 10] },
          ...content
        ],
        styles: {
          title: { fontSize: 18, bold: true, alignment: 'center' },
          header: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
        },
        defaultStyle: { fontSize: 11 }
      }

      setProgress(90)

      // Generate PDF blob in-memory via pdfmake
      const pdfBlob = await new Promise(resolve => {
        pdfMake.createPdf(docDefinition).getBlob(resolve)
      })

      // Trigger forced download of the generated PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name.replace(/\.[^.]+$/, '') + '.pdf'
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
                  <p className="text-muted mb-0">Convert files to PDF directly in your browser.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Select file</label>
                <input ref={inputRef} type="file" accept={accept} className="form-control" onChange={onFileSelect} />
                <div className="form-text">Supported: .docx .xls .xlsx .pptx</div>
              </div>

              {file && (
                <div className="mb-3">
                  <strong>Selected:</strong> {file.name} &bull; {(file.size/1024/1024).toFixed(2)} MB
                </div>
              )}

              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={convert} disabled={!file || status==='converting'}>
                  <i className="fas fa-file-export me-2"></i> Convert to PDF
                </button>
                <button className="btn btn-outline-secondary" onClick={reset}>
                  <i className="fas fa-undo me-2"></i> Reset
                </button>
                <button className="btn btn-link ms-auto" onClick={() => alert('All conversion happens entirely in your browser using client-side libraries. No files are uploaded to any server.')}>
                  <i className="fas fa-info-circle me-1"></i> How it works
                </button>
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
                <i className="fas fa-check-circle text-success me-1"></i> 100% client-side &mdash; your files never leave your device.
                Converters: mammoth.js (.docx), SheetJS (.xls/.xlsx), JSZip (.pptx), pdfmake (PDF).
              </div>
            </div>
          </div>

          <div className="text-center mt-4 text-muted small">Made with <i className="fas fa-heart text-danger"></i> &bull; Bootstrap &bull; Font Awesome</div>
        </div>
      </div>
    </div>
  )
}
