import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

const isProfilePage = (slug: string | undefined) => slug === "index" || slug === "about"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // top-right site nav replaces the old left CategoryNav
  header: [Component.TopNav()],
  afterBody: [
    Component.ConditionalRender({
      component: Component.MobileOnly(
        Component.RecentNotes({
          title: "Recent notes",
          limit: 6,
          linkToMore: "posts/" as SimpleSlug,
        }),
      ),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
  ],
  footer: Component.Footer({
    links: {
      About: "/about",
      GitHub: "https://github.com/ChanJoon",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
    Component.ArticleTitle(),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
    Component.PaperReviewCard(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  right: [
    Component.ConditionalRender({
      component: Component.Graph(),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
    Component.ConditionalRender({
      component: Component.TableOfContents(),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
    Component.ConditionalRender({
      component: Component.Backlinks(),
      condition: (page) => !isProfilePage(page.fileData.slug),
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  right: [],
}
