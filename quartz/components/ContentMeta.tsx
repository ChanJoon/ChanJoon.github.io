import { Date, formatDate, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
  /**
   * Show "Updated <date>" when the modified date is meaningfully later than the
   * created date. Threshold defaults to 1 day.
   */
  showModified: boolean
  modifiedThresholdDays: number
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
  showModified: true,
  modifiedThresholdDays: 1,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        segments.push(<Date date={getDate(cfg, fileData)!} locale={cfg.locale} />)
      }

      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      // "Updated" only renders when the post's frontmatter explicitly carries a
      // modified/lastmod/updated/last-modified field that differs from created.
      // FrontMatter sets data.modified ||= created when the field is absent, so
      // a non-zero diff is the load-bearing signal for "user actually marked
      // this as updated."
      if (options.showModified && fileData.dates?.created && fileData.dates?.modified) {
        const created = fileData.dates.created
        const modified = fileData.dates.modified
        const diffDays = (modified.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays >= options.modifiedThresholdDays) {
          segments.push(
            <span class="modified-date">
              Updated <time datetime={modified.toISOString()}>{formatDate(modified, cfg.locale)}</time>
            </span>,
          )
        }
      }

      return (
        <p show-comma={options.showComma} class={classNames(displayClass, "content-meta")}>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
