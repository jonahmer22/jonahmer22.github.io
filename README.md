# jonahmer22.github.io

This repository hosts my personal resume site that I publish through GitHub Pages. The site highlights my current experience, projects, education, and awards, and links out to my full resume, GitHub profile, and other contact points.

## Stack

- HTML for the structure and content
- CSS for the layout, animations, and light/dark design tweaks
- Vanilla JavaScript for small enhancements like smooth scrolling, skill bar animations, and scroll-based navigation highlighting

## Local Development

1. Clone the repository and open the project directory.
2. Run `python3 blog/build.py` to regenerate the blog from Markdown posts in `blog/posts/`.
3. Serve `index.html` with any static file server (for example `python3 -m http.server`).
4. Open the page in your browser to preview changes.

All of the styling lives in `style.css` and interactive behavior is handled in `script.js`.

### Blog workflow

- Add new posts as Markdown files with front matter inside `blog/posts/` (see existing posts for structure).
- Run `python3 blog/build.py` to generate the HTML pages and update the blog index before committing.

## License & Reuse

This site is released under the GPL v3 (see `LICENSE`). You are welcome to fork or reuse the layout for your own portfolio, provided that your derivative work is also distributed under the GPL and you include attribution - either in your documentation or as a brief comment in the source referencing this project and Jonah Merriam.
