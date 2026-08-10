import { useCallback, useEffect, useState } from 'react'
import { CameraPreview } from '@capacitor-community/camera-preview'

export function useCamera() {
  const [status, setStatus] = useState('idle') // idle | requesting | ready | error

  const start = useCallback(async () => {
    setStatus('requesting')
    document.body.classList.add('camera-preview-active')
    try {
      await CameraPreview.start({
        position: 'rear',
        parent: 'camera-preview-container',
        className: 'camera-preview-fill',
        toBack: true,        // webview'i şeffaf yapıp kamerayı arkaya koyar
        enableZoom: false,
      })
      setStatus('ready')
    } catch (err) {
      setStatus('error')
    }
  }, [])

  const stop = useCallback(async () => {
    document.body.classList.remove('camera-preview-active')
    try { await CameraPreview.stop() } catch {}
  }, [])

  const captureFrame = useCallback(async () => {
    const result = await CameraPreview.capture({ quality: 90 })
    return `data:image/jpeg;base64,${result.value}`
  }, [])

  useEffect(() => {
    start()
    return () => { stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, captureFrame, retry: start }
}