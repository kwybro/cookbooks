import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Camera, Loader2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type ScanImage, scanBook } from '@/lib/api'

export const Route = createFileRoute('/scan')({
  component: ScanPage,
})

type Step = 'cover' | 'index' | 'processing'

interface CapturedImage {
  file: File
  preview: string
}

const readFileAsBase64 = (file: File): Promise<ScanImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      if (!base64) {
        reject(new Error('Failed to read file'))
        return
      }
      const mediaType = file.type as ScanImage['mediaType']
      resolve({ base64, mediaType })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

function ScanPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('cover')
  const [cover, setCover] = useState<CapturedImage | null>(null)
  const [indexPages, setIndexPages] = useState<CapturedImage[]>([])
  const coverInputRef = useRef<HTMLInputElement>(null)
  const indexInputRef = useRef<HTMLInputElement>(null)

  const scan = useMutation({
    mutationFn: async () => {
      if (!cover) throw new Error('Cover image is required')

      const allFiles = [cover, ...indexPages]
      const images = await Promise.all(allFiles.map((img) => readFileAsBase64(img.file)))
      return scanBook(images)
    },
    onSuccess: (data) => {
      navigate({ to: '/books/$bookId', params: { bookId: data.bookId } })
    },
  })

  const handleCoverCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCover({ file, preview: URL.createObjectURL(file) })
  }, [])

  const handleIndexCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setIndexPages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }])
      if (indexInputRef.current) indexInputRef.current.value = ''
    },
    [],
  )

  const removeIndexPage = useCallback((index: number) => {
    setIndexPages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleScan = useCallback(() => {
    setStep('processing')
    scan.mutate()
  }, [scan])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Scan Cookbook</h1>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {step === 'cover' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Front Cover</h2>
              <p className="text-muted-foreground">
                Take a photo of the front cover so we can read the title and author.
              </p>
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCoverCapture}
            />

            {cover ? (
              <div className="relative">
                <img
                  src={cover.preview}
                  alt="Cover preview"
                  className="w-full rounded-lg border border-border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setCover(null)
                    coverInputRef.current?.click()
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-12 hover:bg-accent/50 transition-colors"
              >
                <Camera className="h-10 w-10 text-muted-foreground" />
                <span className="text-muted-foreground">Tap to capture cover</span>
              </button>
            )}

            <Button
              size="lg"
              disabled={!cover}
              onClick={() => setStep('index')}
            >
              Next
            </Button>
          </div>
        )}

        {step === 'index' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Index Pages</h2>
              <p className="text-muted-foreground">
                Take a photo of each index/table of contents page.
              </p>
            </div>

            <input
              ref={indexInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleIndexCapture}
            />

            {indexPages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {indexPages.map((page, i) => (
                  <div key={page.preview} className="relative group">
                    <img
                      src={page.preview}
                      alt={`Index page ${i + 1}`}
                      className="w-full aspect-[3/4] object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeIndexPage(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => indexInputRef.current?.click()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add page
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('cover')}>
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={indexPages.length === 0}
                onClick={handleScan}
              >
                Complete Scan
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            {scan.isError ? (
              <>
                <p className="text-destructive font-medium">Scan failed</p>
                <p className="text-sm text-muted-foreground text-center">{scan.error.message}</p>
                <Button
                  onClick={() => {
                    setStep('index')
                  }}
                >
                  Try again
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  Analyzing your cookbook...
                </p>
                <p className="text-sm text-muted-foreground">This may take a moment.</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
