import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

/**
 * Extract frames from video using ffmpeg
 * NOTE: Requires ffmpeg to be installed on the system
 * 
 * Installation:
 * - Windows: choco install ffmpeg OR download from ffmpeg.org
 * - Mac: brew install ffmpeg
 * - Linux: apt-get install ffmpeg
 */
export async function extractVideoFrames(
  videoBuffer: Buffer,
  options: {
    count?: number // Number of frames to extract
    interval?: number // Extract frame every N seconds
    quality?: number // 1-31 (lower is better quality, 2 is very high quality)
  } = {}
): Promise<Buffer[]> {
  const { count = 10, quality = 2 } = options

  // Check if ffmpeg is available
  await checkFfmpegInstalled()

  // Create temporary directory for processing
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metacoach-'))
  const videoPath = path.join(tempDir, 'input.mp4')
  const framePattern = path.join(tempDir, 'frame-%03d.jpg')

  try {
    // Write video to temp file
    await fs.writeFile(videoPath, videoBuffer)

    // Get video duration first
    const duration = await getVideoDuration(videoPath)

    // Calculate frame extraction rate
    let ffmpegCommand: string

    if (options.interval) {
      // Extract frame every N seconds
      ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "fps=1/${options.interval}" -q:v ${quality} "${framePattern}"`
    } else {
      // Extract N frames evenly distributed
      const fps = count / duration
      ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "fps=${fps}" -q:v ${quality} "${framePattern}"`
    }

    // Execute ffmpeg
    await execAsync(ffmpegCommand)

    // Read extracted frames
    const files = await fs.readdir(tempDir)
    const frameFiles = files.filter((f) => f.startsWith('frame-') && f.endsWith('.jpg')).sort()

    // Read frame buffers
    const frames: Buffer[] = []
    for (const file of frameFiles.slice(0, count)) {
      const framePath = path.join(tempDir, file)
      const frameBuffer = await fs.readFile(framePath)
      frames.push(frameBuffer)
    }

    return frames
  } catch (error: any) {
    console.error('[Video Utils] Error extracting frames:', error.message)
    throw new Error(`Failed to extract video frames: ${error.message}`)
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('[Video Utils] Failed to cleanup temp directory:', error)
    }
  }
}

/**
 * Extract a single frame from video at specific timestamp
 */
export async function extractSingleFrame(
  videoBuffer: Buffer,
  timestamp: number = 0, // Seconds
  quality: number = 2
): Promise<Buffer> {
  await checkFfmpegInstalled()

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metacoach-'))
  const videoPath = path.join(tempDir, 'input.mp4')
  const framePath = path.join(tempDir, 'frame.jpg')

  try {
    await fs.writeFile(videoPath, videoBuffer)

    // Extract frame at specific timestamp
    const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v ${quality} "${framePath}"`
    await execAsync(command)

    const frameBuffer = await fs.readFile(framePath)
    return frameBuffer
  } catch (error: any) {
    console.error('[Video Utils] Error extracting single frame:', error.message)
    throw new Error(`Failed to extract frame at ${timestamp}s: ${error.message}`)
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('[Video Utils] Failed to cleanup temp directory:', error)
    }
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const { stdout } = await execAsync(command)
    return parseFloat(stdout.trim())
  } catch (error: any) {
    console.error('[Video Utils] Error getting video duration:', error.message)
    // Default to 30 seconds if we can't determine
    return 30
  }
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoBuffer: Buffer): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  codec: string
}> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metacoach-'))
  const videoPath = path.join(tempDir, 'input.mp4')

  try {
    await fs.writeFile(videoPath, videoBuffer)

    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json "${videoPath}"`
    const { stdout } = await execAsync(command)
    const data = JSON.parse(stdout)

    const stream = data.streams[0]
    const format = data.format

    // Parse frame rate (e.g., "30/1" -> 30)
    const [num, den] = stream.r_frame_rate.split('/').map(Number)
    const fps = den ? num / den : num

    return {
      duration: parseFloat(format.duration) || 0,
      width: stream.width || 0,
      height: stream.height || 0,
      fps: fps || 30,
      codec: stream.codec_name || 'unknown',
    }
  } catch (error: any) {
    console.error('[Video Utils] Error getting video metadata:', error.message)
    throw new Error(`Failed to get video metadata: ${error.message}`)
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('[Video Utils] Failed to cleanup temp directory:', error)
    }
  }
}

/**
 * Check if ffmpeg is installed
 */
async function checkFfmpegInstalled(): Promise<void> {
  try {
    await execAsync('ffmpeg -version')
  } catch (error) {
    throw new Error(
      'ffmpeg is not installed. Please install it:\n' +
      '  Windows: choco install ffmpeg\n' +
      '  Mac: brew install ffmpeg\n' +
      '  Linux: apt-get install ffmpeg'
    )
  }
}

/**
 * Extract thumbnail (first frame) from video
 */
export async function extractThumbnail(videoBuffer: Buffer, quality: number = 2): Promise<Buffer> {
  return extractSingleFrame(videoBuffer, 0, quality)
}

/**
 * Extract frames for hook analysis (first 3-5 seconds)
 */
export async function extractHookFrames(videoBuffer: Buffer): Promise<Buffer[]> {
  return extractVideoFrames(videoBuffer, {
    count: 5,
    quality: 2,
  })
}

/**
 * Generate video preview GIF (for quick previews)
 * Returns buffer of animated GIF
 */
export async function generatePreviewGif(
  videoBuffer: Buffer,
  options: {
    duration?: number // Seconds of video to convert
    fps?: number // Frames per second in GIF
    width?: number // Width of GIF (height scaled automatically)
  } = {}
): Promise<Buffer> {
  const { duration = 3, fps = 10, width = 320 } = options

  await checkFfmpegInstalled()

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metacoach-'))
  const videoPath = path.join(tempDir, 'input.mp4')
  const gifPath = path.join(tempDir, 'preview.gif')

  try {
    await fs.writeFile(videoPath, videoBuffer)

    // Generate GIF with ffmpeg
    const command = `ffmpeg -t ${duration} -i "${videoPath}" -vf "fps=${fps},scale=${width}:-1:flags=lanczos" -gifflags +transdiff -y "${gifPath}"`
    await execAsync(command)

    const gifBuffer = await fs.readFile(gifPath)
    return gifBuffer
  } catch (error: any) {
    console.error('[Video Utils] Error generating preview GIF:', error.message)
    throw new Error(`Failed to generate preview GIF: ${error.message}`)
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('[Video Utils] Failed to cleanup temp directory:', error)
    }
  }
}
