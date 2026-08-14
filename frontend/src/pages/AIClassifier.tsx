import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Camera, Upload, Brain, CheckCircle2, AlertCircle, RefreshCw,
  Zap, X, Image as ImageIcon, RotateCcw, ArrowRight
} from 'lucide-react'
import api from '../lib/api'
import type { Classification, ClassificationSummary } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { timeAgo, formatDateTime, cn } from '../lib/utils'

// UI State Types matching exact requirements
type AIWorkflowState =
  | 'CAMERA_CLOSED'
  | 'CAMERA_ACTIVE'
  | 'PHOTO_CAPTURED'
  | 'ANALYZING'
  | 'CLASSIFICATION_COMPLETE'
  | 'CLASSIFICATION_FAILED'

export default function AIClassifier() {
  const queryClient = useQueryClient()

  // State Management
  const [workflowState, setWorkflowState] = useState<AIWorkflowState>('CAMERA_CLOSED')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null)
  const [classificationResult, setClassificationResult] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Media Stream & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // ── Fetch Classification Statistics (GET /api/waste/statistics) ─────────
  const { data: statistics } = useQuery<ClassificationSummary>({
    queryKey: ['waste', 'statistics'],
    queryFn: () => api.get('/waste/statistics').then(r => r.data),
    refetchInterval: 15_000,
  })

  // ── Fetch Classification History (GET /api/waste/history) ────────────────
  const { data: history = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ['waste', 'history'],
    queryFn: () => api.get('/waste/history?limit=15').then(r => r.data),
    refetchInterval: 15_000,
  })

  // ── Stop Camera Stream Cleanup ──────────────────────────────────────────
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [])

  // ── Step 1: Open Camera (User Interactive Trigger) ──────────────────────
  const handleOpenCamera = async () => {
    setCameraError(null)
    setErrorMessage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      mediaStreamRef.current = stream
      setWorkflowState('CAMERA_ACTIVE')

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (err: any) {
      console.error('Camera permission error:', err)
      setCameraError(err?.message ?? 'Could not access camera. Please check browser permissions.')
      setWorkflowState('CAMERA_CLOSED')
    }
  }

  // ── Step 2: Close Camera ────────────────────────────────────────────────
  const handleCloseCamera = () => {
    stopCameraStream()
    setCapturedBlob(null)
    setCapturedImageUri(null)
    setWorkflowState('CAMERA_CLOSED')
  }

  // ── Step 3: Capture Photo (1 Frame) ────────────────────────────────────
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    const videoWidth = video.videoWidth || 640
    const videoHeight = video.videoHeight || 480
    const minDim = Math.min(videoWidth, videoHeight)
    const cropSize = minDim * 0.5 // Crop 50% of the frame (tight focus on the target box)
    
    // Compute center-square bounding coordinates
    const sx = (videoWidth - cropSize) / 2
    const sy = (videoHeight - cropSize) / 2

    // Set square canvas output sizes to match MobileNetV2 inputs
    canvas.width = 448
    canvas.height = 448

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Draw cropped square region
      ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, 448, 448)
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob)
          const dataUri = canvas.toDataURL('image/jpeg')
          setCapturedImageUri(dataUri)
          stopCameraStream() // Privacy: Stop live stream after photo captured
          setWorkflowState('PHOTO_CAPTURED')
        }
      }, 'image/jpeg', 0.92)
    }
  }

  // ── Step 4: Retake Photo ────────────────────────────────────────────────
  const handleRetake = () => {
    setCapturedBlob(null)
    setCapturedImageUri(null)
    setClassificationResult(null)
    setErrorMessage(null)
    handleOpenCamera()
  }

  // ── Step 5: Classify Captured Image (POST /api/waste/classify) ─────────
  const classifyMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData()
      formData.append('file', blob, 'camera_capture.jpg')
      const res = await api.post('/waste/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onMutate: () => {
      setWorkflowState('ANALYZING')
    },
    onSuccess: (data) => {
      setClassificationResult(data)
      setWorkflowState('CLASSIFICATION_COMPLETE')
      queryClient.invalidateQueries({ queryKey: ['waste'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: any) => {
      setErrorMessage(err.message ?? 'Classification failed. Please try again.')
      setWorkflowState('CLASSIFICATION_FAILED')
    },
  })

  const handleClassify = () => {
    if (capturedBlob) {
      classifyMutation.mutate(capturedBlob)
    }
  }

  // File fallback upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCapturedBlob(file)
      setCapturedImageUri(URL.createObjectURL(file))
      setWorkflowState('PHOTO_CAPTURED')
    }
  }

  // ── Step 6: Capture Another (Reset Workflow) ───────────────────────────
  const handleCaptureAnother = () => {
    stopCameraStream()
    setCapturedBlob(null)
    setCapturedImageUri(null)
    setClassificationResult(null)
    setErrorMessage(null)
    setWorkflowState('CAMERA_CLOSED')
  }

  return (
    <PageWrapper title="AI Waste Categorization" subtitle="Interactive browser camera capture & MobileNetV2 classification engine">
      <div className="space-y-6 max-w-6xl">

        {/* ── 1. STATISTICS BAR (GET /api/waste/statistics) ───────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info/10 text-info border border-info/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Scans</p>
              <p className="text-2xl font-black text-white mt-0.5">{statistics?.total_today ?? 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-bio/10 text-bio border border-bio/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BIODEGRADABLE</p>
              <p className="text-2xl font-black text-bio mt-0.5">{statistics?.bio_count ?? 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-nonbio/10 text-nonbio border border-nonbio/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NON-BIODEGRADABLE</p>
              <p className="text-2xl font-black text-nonbio mt-0.5">{statistics?.nonbio_count ?? 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sim/10 text-sim border border-sim/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Confidence</p>
              <p className="text-2xl font-black text-sim mt-0.5">
                {statistics?.avg_confidence ? `${(statistics.avg_confidence * 100).toFixed(1)}%` : '—'}
              </p>
            </div>
          </Card>
        </div>

        {/* ── 2. CAMERA WORKFLOW MAIN INTERFACE ────────────────────────────── */}
        <Card className="overflow-hidden border-slate-800">
          
          {/* Workflow Header & Active State Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Waste Inspector</h3>
              <p className="text-xs text-slate-400">Capture single item photo for MobileNetV2 category analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                workflowState === 'CAMERA_ACTIVE' ? 'warning' :
                workflowState === 'ANALYZING' ? 'info' :
                workflowState === 'CLASSIFICATION_COMPLETE' ? 'online' : 'default'
              }>
                State: {
                  workflowState === 'CAMERA_CLOSED' ? 'Camera Closed' :
                  workflowState === 'CAMERA_ACTIVE' ? 'Camera Active' :
                  workflowState === 'PHOTO_CAPTURED' ? 'Photo Captured' :
                  workflowState === 'ANALYZING' ? 'Analyzing...' :
                  workflowState === 'CLASSIFICATION_COMPLETE' ? 'Classification Complete' : 'Classification Failed'
                }
              </Badge>
            </div>
          </div>

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Errors Alert */}
          {cameraError && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center justify-between">
              <span>⚠️ {cameraError}</span>
              <button onClick={() => setCameraError(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── WORKFLOW STATE 1: CAMERA CLOSED ────────────────────────────── */}
          {workflowState === 'CAMERA_CLOSED' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-surface-850 rounded-xl border border-slate-800/80">
              <div className="p-4 rounded-2xl bg-surface-800 text-brand-400 border border-slate-700/60 shadow-lg">
                <Camera className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-base font-bold text-white">Browser Camera Standby</h4>
                <p className="text-xs text-slate-400">
                  Camera permission requires user interaction. Click below to open your camera preview.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleOpenCamera}
                  className="btn-primary text-xs px-6 py-2.5 shadow-lg shadow-brand-500/20"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </button>

                <span className="text-xs text-slate-600 font-mono">— OR —</span>

                <label className="btn-secondary text-xs px-5 py-2.5 cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-400" />
                  Upload Image File
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* ── WORKFLOW STATE 2: CAMERA ACTIVE (LIVE PREVIEW) ──────────────── */}
          {workflowState === 'CAMERA_ACTIVE' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-96 mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Centered Square Box Overlay for Alignment Guidance */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 md:w-64 md:h-64 border-4 border-dashed border-brand-500 rounded-2xl flex flex-col items-center justify-center bg-black/10">
                    <span className="text-[10px] font-bold text-brand-400 bg-black/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Align Waste Here
                    </span>
                  </div>
                </div>

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] text-white font-mono flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                  LIVE PREVIEW
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCapturePhoto}
                  className="btn-primary text-xs px-8 py-2.5 shadow-lg shadow-brand-500/20 bg-brand-500 hover:bg-brand-400"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  onClick={handleCloseCamera}
                  className="btn-secondary text-xs px-4 py-2.5"
                >
                  <X className="w-4 h-4" />
                  Close Camera
                </button>
              </div>
            </div>
          )}

          {/* ── WORKFLOW STATE 3: PHOTO CAPTURED (PREVIEW STILL) ────────────── */}
          {workflowState === 'PHOTO_CAPTURED' && capturedImageUri && (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-96 mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                <img
                  src={capturedImageUri}
                  alt="Captured waste frame"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] text-brand-400 font-mono flex items-center gap-2 border border-brand-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  STILL FRAME CAPTURED
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleRetake}
                  className="btn-secondary text-xs px-5 py-2.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={handleClassify}
                  className="btn-primary text-xs px-8 py-2.5 shadow-lg shadow-brand-500/20"
                >
                  <Brain className="w-4 h-4" />
                  Classify Image
                </button>
              </div>
            </div>
          )}

          {/* ── WORKFLOW STATE 4: ANALYZING... (LOADING SPINNER) ─────────────── */}
          {workflowState === 'ANALYZING' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Analyzing Waste Image...</p>
                <p className="text-xs text-slate-400">Executing MobileNetV2 neural network (models/waste_model.h5)</p>
              </div>
            </div>
          )}

          {/* ── WORKFLOW STATE 5: CLASSIFICATION COMPLETE ────────────────────── */}
          {workflowState === 'CLASSIFICATION_COMPLETE' && classificationResult && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Captured Image Thumbnail */}
                {capturedImageUri && (
                  <div className="rounded-xl overflow-hidden bg-surface-850 border border-slate-800 p-2 max-h-72">
                    <img src={capturedImageUri} alt="Analyzed waste item" className="w-full h-full object-contain rounded-lg" />
                  </div>
                )}

                {/* Classification Result Card */}
                <div className="space-y-4">
                  {/* Category Result Banner */}
                  <div className={cn(
                    'p-6 rounded-2xl border flex flex-col justify-between shadow-xl',
                    classificationResult.label === 'BIO'
                      ? 'bg-bio/10 border-bio/30 text-bio'
                      : 'bg-nonbio/10 border-nonbio/30 text-nonbio'
                  )}>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">CLASSIFICATION RESULT</span>
                      <h2 className="text-3xl font-black tracking-tight mt-1">
                        {classificationResult.display_label ?? (classificationResult.label === 'BIO' ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE')}
                      </h2>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">Confidence Score</span>
                      <span className="text-2xl font-black text-white">
                        {(classificationResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Metadata Card */}
                  <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Model Status:</span>
                      <span className="font-semibold text-brand-400">{classificationResult.model_status ?? 'waste_model.h5 connected'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Classification Status:</span>
                      <span className="font-semibold text-white">{classificationResult.classification_status ?? 'Completed'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Timestamp:</span>
                      <span className="font-mono">{formatDateTime(classificationResult.classified_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>ESP32 Command:</span>
                      <span className="font-mono text-brand-400 font-bold">
                        '{classificationResult.hardware_command}' ({classificationResult.label === 'BIO' ? '45°' : '135°'})
                      </span>
                    </div>
                  </div>

                  {/* "Capture Another" Action Button */}
                  <button
                    onClick={handleCaptureAnother}
                    className="btn-primary w-full justify-center text-xs py-3 font-bold shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Capture Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── WORKFLOW STATE 6: CLASSIFICATION FAILED ─────────────────────── */}
          {workflowState === 'CLASSIFICATION_FAILED' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-danger/10 text-danger border border-danger/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Classification Failed</p>
                <p className="text-xs text-slate-400 max-w-md">{errorMessage}</p>
              </div>
              <button onClick={handleRetake} className="btn-primary text-xs px-6 py-2.5">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

        </Card>

        {/* ── 3. CLASSIFICATION HISTORY LOG (GET /api/waste/history) ────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Classification History & Audit Log</h3>
            <span className="text-xs text-slate-400">{history.length} Saved Records</span>
          </div>

          {loadingHistory ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-surface-800 rounded animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No classification history logged in database</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Result Category</th>
                    <th>Confidence</th>
                    <th>Servo Byte</th>
                    <th>Mode</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record: any) => (
                    <tr key={record.id}>
                      <td className="font-mono text-xs text-slate-300">{record.image_filename ?? 'camera_capture.jpg'}</td>
                      <td>
                        <Badge variant={record.label === 'BIO' ? 'bio' : 'nonbio'}>
                          {record.display_label ?? (record.label === 'BIO' ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE')}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-200">{(record.confidence * 100).toFixed(1)}%</td>
                      <td className="font-mono text-xs text-brand-400 font-bold">'{record.hardware_command ?? (record.label === 'BIO' ? 'B' : 'N')}'</td>
                      <td>
                        <Badge variant={record.hardware_mode === 'SIMULATED' ? 'simulated' : 'real'}>
                          {record.hardware_mode}
                        </Badge>
                      </td>
                      <td className="text-xs text-slate-400">{timeAgo(record.classified_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </PageWrapper>
  )
}
