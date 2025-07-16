// apps/web/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Service } from '@/lib/s3'

const s3Service = new S3Service()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイル検証
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // S3アップロード
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `uploads/${Date.now()}-${file.name}`
    await s3Service.uploadFile(buffer, key, file.type)
    
    // データベース記録
    const processingRequest = await prisma.processingRequest.create({
      data: {
        uploaderId: 'temp-user-id', // 認証実装後に修正
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        s3Key: key,
        status: 'UPLOADED',
      },
    })

    // Lambda関数トリガー (後で実装)
    // await triggerProcessingLambda(processingRequest.id)

    return NextResponse.json({
      requestId: processingRequest.id,
      status: 'uploaded',
      message: 'File uploaded successfully',
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}