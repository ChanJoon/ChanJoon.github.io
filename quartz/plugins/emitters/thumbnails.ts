import fs from "fs"
import path from "path"
import sharp from "sharp"
import { FilePath, FullSlug, joinSegments, slugifyFilePath } from "../../util/path"
import { glob } from "../../util/glob"
import { QuartzEmitterPlugin } from "../types"

export interface Options {
  /** Width of the generated thumbnail, in CSS pixels before DPR. */
  width: number
  quality: number
  /** Output directory under the site root. */
  outDir: string
}

const defaultOptions: Options = {
  width: 320,
  quality: 78,
  outDir: "thumbs",
}

export const thumbnailPath = (slug: FullSlug, outDir = defaultOptions.outDir) =>
  `${outDir}/${slug}.webp`

/**
 * Resizes each note's first image into a small WebP for listing pages.
 *
 * Serving the originals instead would put ~4.4MB of PNGs on /posts — the source
 * images average 214KB and run to 551KB, because they are figures cropped from
 * papers at full resolution.
 */
export const Thumbnails: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Thumbnails",
    async *emit({ argv, cfg }, content) {
      // An Obsidian embed records just the filename (`figure.png`); CrawlLinks
      // resolves those later against the whole file list, so resolve the same
      // way here — by path first, then by basename.
      const files = await glob("**", argv.directory, [
        "**/*.md",
        ...cfg.configuration.ignorePatterns,
      ])
      const byPath = new Map<string, FilePath>()
      const byBasename = new Map<string, FilePath[]>()
      const addBasename = (key: string, fp: FilePath) =>
        byBasename.set(key, [...(byBasename.get(key) ?? []), fp])
      for (const fp of files) {
        const slugged = slugifyFilePath(fp)
        byPath.set(slugged, fp)
        byPath.set(fp, fp)
        addBasename(path.basename(fp), fp)
        // 21 of these images have spaces in the filename, and the embed records
        // the slugified form (`Liu et al_fig2.png` -> `Liu-et-al_fig2.png`)
        const sluggedBase = path.basename(slugged)
        if (sluggedBase !== path.basename(fp)) addBasename(sluggedBase, fp)
      }

      const resolve = (src: string, noteDir: string): FilePath | undefined => {
        const direct = byPath.get(src) ?? byPath.get(path.posix.normalize(src))
        if (direct) return direct
        // relative to the note that embeds it
        const nearby = path.posix.normalize(path.posix.join(noteDir, src))
        if (byPath.has(nearby)) return byPath.get(nearby)
        const candidates = byBasename.get(path.basename(src)) ?? []
        if (candidates.length === 1) return candidates[0]
        // ambiguous basename: prefer a file sitting next to the note
        return candidates.find((c) => path.posix.dirname(c).startsWith(noteDir))
      }

      for (const [, file] of content) {
        const src = file.data.thumbnail
        const slug = file.data.slug
        if (!src || !slug) continue

        const noteDir = path.posix.dirname(file.data.relativePath ?? "")
        const real = resolve(src, noteDir === "." ? "" : noteDir)
        if (!real) {
          console.warn(`[Thumbnails] ${slug}: source image not found (${src})`)
          continue
        }
        const input = joinSegments(argv.directory, real)
        if (!fs.existsSync(input)) {
          console.warn(`[Thumbnails] ${slug}: ${real} is missing on disk`)
          continue
        }

        const dest = joinSegments(argv.output, thumbnailPath(slug, opts.outDir)) as FilePath
        await fs.promises.mkdir(path.dirname(dest), { recursive: true })
        try {
          await sharp(input)
            .resize({ width: opts.width, withoutEnlargement: true })
            .webp({ quality: opts.quality })
            .toFile(dest)
        } catch (err) {
          // A single unreadable image should not take the whole site down.
          console.warn(`[Thumbnails] ${slug}: could not resize ${src}: ${err}`)
          continue
        }
        yield dest
      }
    },
  }
}
