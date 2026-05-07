import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/categoryNav.scss"

interface Category {
  icon: string
  label: string
  href: string
}

interface Options {
  title: string
  categories: Category[]
}

const defaultOptions: Options = {
  title: "Categories",
  categories: [
    { icon: "📑", label: "Paper Review", href: "/tags/paper" },
    { icon: "🛰️", label: "Optimal Control & Planning", href: "/tags/control-planning" },
    { icon: "🤖", label: "Reinforcement Learning", href: "/tags/RL" },
    { icon: "📚", label: "Self Study", href: "/tags/self-study" },
    { icon: "🗂️", label: "All tags", href: "/tags" },
  ],
}

export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  const CategoryNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "category-nav")}>
        <h3>{opts.title}</h3>
        <ul>
          {opts.categories.map((cat) => {
            const target = (
              cat.href.startsWith("/") ? cat.href.slice(1) : cat.href
            ) as FullSlug
            const href = cat.href.startsWith("/")
              ? resolveRelative(fileData.slug!, target)
              : cat.href
            return (
              <li>
                <a href={href} class="internal">
                  <span class="cat-icon" aria-hidden="true">
                    {cat.icon}
                  </span>
                  <span class="cat-label">{cat.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  CategoryNav.css = style
  return CategoryNav
}) satisfies QuartzComponentConstructor
