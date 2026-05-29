import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Landon Foister — Field Notes',
  tagline: 'Research notes, lab reports, and competition logs.',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://blog.landonfoister.com',
  baseUrl: '/',
  trailingSlash: true,

  organizationName: 'Foister150',
  projectName: 'Personal-Website',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          routeBasePath: '/',
          blogTitle: 'Field Notes',
          blogDescription:
            'Research notes, lab reports, and competition logs from Landon Foister.',
          showReadingTime: true,
          blogSidebarCount: 0,
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom', 'json'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'LANDON FOISTER',
      items: [
        {href: 'https://landonfoister.com/projects/', label: '01 PROJECTS', position: 'right'},
        {href: 'https://landonfoister.com/assets/landon-foister-resume-public.pdf', label: '02 RESUME', position: 'right'},
        {to: '/', label: '03 BLOG', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      copyright: `EDITORIAL CHANNEL / READY · POSTS // 001 · © ${new Date().getFullYear()} LANDON FOISTER`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
