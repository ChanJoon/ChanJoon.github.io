import fs from "fs"
import path from "path"
import sharp from "sharp"
import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { glob } from "../../util/glob"
import { QuartzEmitterPlugin } from "../types"

export interface Options {
  /** Images wider than this are scaled down. The reading column is ~736px. */
  maxWidth: number
  quality: number
  /** How many images to process at once. */
  concurrency: number
}

const defaultOptions: Options = {
  maxWidth: 1400,
  quality: 80,
  concurrency: 8,
}

const PNG = new Set([".png"])
const JPEG = new Set([".jpg", ".jpeg"])

/**
 * Rewrites the copies `Assets` placed in the output directory with smaller ones.
 *
 * The figures here are cropped from papers at full resolution — 37.8MB across
 * 337 files, with single PNGs over 2MB — while the reading column is 736px wide.
 * Palette-quantized PNG takes that to 11.0MB. WebP only reaches 10.3MB, which is
 * not worth rewriting 337 embed references and risking a broken image, so the
 * filenames and extensions stay exactly as they are.
 *
 * Nothing is written when the result would be larger than the original, and a
 * failure on one image leaves that image untouched rather than failing the site.
 *
 * Must run after `Assets`, which is what puts the originals there.
 */
export const OptimizeImages: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "OptimizeImages",
    async *emit({ argv, cfg }) {
      const files = await glob("**", argv.directory, [
        "**/*.md",
        ...cfg.configuration.ignorePatterns,
      ])
      const targets = files.filter((fp) => {
        const ext = path.extname(fp).toLowerCase()
        return PNG.has(ext) || JPEG.has(ext)
      })

      let savedBytes = 0
      let rewritten = 0

      const optimize = async (fp: FilePath): Promise<FilePath | undefined> => {
        const src = joinSegments(argv.directory, fp)
        const dest = joinSegments(argv.output, slugifyFilePath(fp)) as FilePath
        const ext = path.extname(fp).toLowerCase()
        try {
          const original = (await fs.promises.stat(src)).size
          const pipeline = sharp(src).resize({ width: opts.maxWidth, withoutEnlargement: true })
          const buf = PNG.has(ext)
            ? await pipeline.png({ palette: true, quality: opts.quality, effort: 6 }).toBuffer()
            : await pipeline.jpeg({ quality: opts.quality, mozjpeg: true }).toBuffer()

          if (buf.length >= original) return undefined
          await fs.promises.mkdir(path.dirname(dest), { recursive: true })
          await fs.promises.writeFile(dest, buf)
          savedBytes += original - buf.length
          rewritten++
          return dest
        } catch (err) {
          console.warn(`[OptimizeImages] left ${fp} as-is: ${err}`)
          return undefined
        }
      }

      // simple fixed-size worker pool; sharp releases the event loop while it works
      let cursor = 0
      const inFlight: Promise<FilePath | undefined>[] = []
      const results: FilePath[] = []
      const drain = async () => {
        const done = await Promise.all(inFlight)
        inFlight.length = 0
        for (const d of done) if (d) results.push(d)
      }
      while (cursor < targets.length) {
        inFlight.push(optimize(targets[cursor++]))
        if (inFlight.length >= opts.concurrency) await drain()
      }
      await drain()

      console.log(
        `[OptimizeImages] rewrote ${rewritten}/${targets.length} images, ` +
          `saved ${(savedBytes / 1048576).toFixed(1)} MB`,
      )
      for (const fp of results) yield fp
    },
  }
}
