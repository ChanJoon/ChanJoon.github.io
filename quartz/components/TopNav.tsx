import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/topNav.scss"

interface NavLink {
  label: string
  href: string // site-absolute path, optionally with #anchor
}

interface Options {
  links: NavLink[]
}

const defaultOptions: Options = {
  links: [
    { label: "Publications", href: "/#publications" },
    { label: "News", href: "/#news" },
    { label: "Blog", href: "/posts" },
    { label: "About", href: "/about" },
  ],
}

export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    return (
      <nav class={classNames(displayClass, "top-nav")}>
        {opts.links.map((l) => {
          const [path, anchor] = l.href.split("#")
          const slug = (path.replace(/^\//, "") || "index") as FullSlug
          const base = resolveRelative(fileData.slug!, slug)
          const href = anchor ? `${base}#${anchor}` : base
          return (
            <a href={href} class="top-nav__link internal">
              {l.label}
            </a>
          )
        })}
      </nav>
    )
  }

  TopNav.css = style
  return TopNav
}) satisfies QuartzComponentConstructor
