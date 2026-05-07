import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "ChanJoon",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    locale: "en-US",
    analytics: {
      provider: "google",
      tagId: "G-NY368MZMG8",
    },
    baseUrl: "chanjoon.github.io",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Pretendard Variable",
        body: "Pretendard Variable",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#fdfcf7",
          lightgray: "#e6e1d3",
          gray: "#8a8579",
          darkgray: "#3d3a33",
          dark: "#1f1d18",
          secondary: "#3a5a40",
          tertiary: "#84a59d",
          highlight: "rgba(244, 206, 20, 0.18)",
          textHighlight: "rgba(244, 206, 20, 0.32)",
        },
        darkMode: {
          light: "#0f0f10",
          lightgray: "#1f2023",
          gray: "#6c6f76",
          darkgray: "#c8c9cd",
          dark: "#f4f4f5",
          secondary: "#e6a373",
          tertiary: "#84a59d",
          highlight: "rgba(255, 255, 255, 0.06)",
          textHighlight: "rgba(230, 163, 115, 0.22)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents({
        maxDepth: 4,
        collapseByDefault: false,
      }),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.Citations({
        bibliographyFile: "./content/bibliography.bib",
        linkCitations: true,
        csl: "vancouver",
      }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.TagFeeds({
        tags: ["paper", "control-planning", "RL", "self-study"],
        rssLimit: 20,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // CustomOgImages disabled: incompatible with fontOrigin: "local" (it hardcodes Google Fonts)
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
