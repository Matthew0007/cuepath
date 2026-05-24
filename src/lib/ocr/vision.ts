// Google Vision API — 이미지에서 텍스트 추출 (4층 OCR)
export async function extractTextFromImage(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  if (!apiKey) return ''

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  )

  if (!res.ok) return ''
  const data = await res.json()
  return data.responses?.[0]?.fullTextAnnotation?.text ?? ''
}
