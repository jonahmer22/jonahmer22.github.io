# jonahmer22.github.io

This repository hosts my personal resume site that I publish through GitHub Pages. The site highlights my current experience, projects, education, and awards, and links out to my full resume, GitHub profile, and other contact points.

## Stack

- HTML for the structure and content
- ~30 lines of CSS, system monospace font, automatic light/dark via `color-scheme`
- ~25 lines of JS: prefetch on hover, and a footer that reports the page's measured transfer size

## Local Development

1. Clone the repository and open the project directory.
2. Run `python3 blog/build.py` to regenerate the blog from Markdown posts in `blog/posts/`.
3. Serve `index.html` with any static file server (for example `python3 -m http.server`).
4. Open the page in your browser to preview changes.

Styling is `style.css`, behavior is `script.js`. No build step except the blog.

### Blog workflow

- Add new posts as Markdown files with front matter inside `blog/posts/` (see existing posts for structure).
- Run `python3 blog/build.py` to generate the HTML pages and update the blog index before committing.

## License & Reuse

This site is released under the GPL v3 (see `LICENSE`). You are welcome to fork or reuse the layout for your own portfolio, provided that your derivative work is also distributed under the GPL and you include attribution - either in your documentation or as a brief comment in the source referencing this project and Jonah Merriam.
