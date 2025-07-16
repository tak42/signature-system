'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

// APIレスポンスの型定義
interface UploadResponse {
  requestId: string
  status: string
  message: string
}

interface ErrorResponse {
  error: string
}

type ApiResponse = UploadResponse | ErrorResponse | null

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ApiResponse>(null)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Upload failed:', error)
      setResult({ error: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">File Upload</h1>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Uploading...</p>
        ) : isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag & drop a file here, or click to select</p>
        )}
      </div>

      {result && (
        <div className="mt-8 p-4 border rounded">
          {'error' in result ? (
            <div className="text-red-600">
              <p>Error: {result.error}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>Success: {result.message}</p>
              <p>Request ID: {result.requestId}</p>
              <p>Status: {result.status}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}