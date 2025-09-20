---
title: Portfolio Refresh 2025
date: 2025-09-21
summary: Documenting the overhaul of jonahmerriam.net with a fresh layout, richer content sections, and a Markdown-powered blog.
---
## New look, clearer story
I rebuilt the entire landing page so it leads with the essentials: a tighter hero introduction, quick access to my resume, and consistent navigation that highlights each section as you scroll. Cards now use a light/dark friendly palette, the awards section made it onto the page, and works-in-progress finally sit alongside shipped projects.

## Content updates across the board
- **Skills** now focus on the systems work I do most (C, low-level programming, tooling) with animated progress bars for a quick read.
- **Experience & education** reflect my current internship at Bibliomation and the latest program info from UConn.
- **Contact** swaps the phone number for email + portfolio links to keep outreach simpler.
- **Footer** automatically updates the year so it stays current without manual edits.

## Blog + learning log
The site now includes a blog at `/blog/` with:
- A "What I'm Learning Now" feed to journal ongoing experiments.
- Full posts for ReMem and the Arena library, including rich code snippets.
- Cards that link directly to each article and highlight publication dates.

## Markdown-driven workflow
To avoid hand-writing HTML, I built a tiny generator that turns Markdown into blog pages and updates the index automatically. Adding a post is now:

```bash
python3 blog/build.py
```

The script parses front matter, renders headings, lists, inline code, fenced code blocks, and links, then drops the output into the existing layout.

## Reusable components & polish
- Shared styles live in `style.css`, including dark-mode aware code blocks and reusable animation delays.
- `script.js` handles smooth scrolling, hero fade-ins, scroll spy navigation, and skill bar animations.
- The resume CTA and blog CTA share a common button style so calls-to-action feel cohesive.

## What's next
A few ideas on deck: generated RSS feeds, featured project spotlights with screenshots, and a public changelog so updates like this one are easier to track. For now, the site finally reflects what I'm building day to day - and keeps growing without fighting the tooling.
