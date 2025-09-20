---
title: Arena Patterns in C
date: 2025-09-07
summary: Sharing how a lightweight shunting arena keeps my C projects fast and easy to reset.
---
## Why another arena?
I reach for arenas whenever I want deterministic lifetimes without the bookkeeping of individual frees. While building ReMem I pulled the arena into its own GPL v3 library so I could reuse it across interpreters, CLI tools, and coursework projects. The goal was to keep the implementation small enough to drop straight into source trees without adding build complexity.

## Two flavors, same core
The library ships with global and local APIs. The global functions (`arenaInit`, `arenaAlloc`, `arenaReset`, `arenaDestroy`) hide everything behind static state, making it painless to slot the arena into a single-threaded prototype. Each function has a "sister" that accepts an explicit `Arena *` so more advanced projects can juggle multiple arenas or manage lifetimes manually.

## How the shunting works
Allocations pull from a configurable `BUFF_SIZE` block (1 MB by default). When you request memory, two pointers march forward: one tracks the current block, and the other tracks where to place your data. If a request would overflow the block, the arena allocates a fresh chunk, links it, and continues. Resetting simply rewinds the pointers and frees any extra blocks, which keeps cleanup costs trivial.

## Patterns I keep using
- **Transient builders:** parse trees, IR, or staging buffers that can all disappear in one reset.
- **Embedded scripting:** toy languages like Marrow lean on arenas to allocate AST nodes without worrying about fine-grained frees.
- **Testing harnesses:** deterministic allocation makes leak tracking predictable and repeatable.

## Tips for adopting the arena
Start by swapping `malloc` calls that already clean up in one place, like per-frame buffers. Use `arenaReset` instead of repeatedly destroying and initializing; it frees everything except the original buffer so most allocations hit fast paths. If you need threaded access, spin up an arena per worker - this keeps the data structure lock-free and requires minimal extra code.

The entire implementation lives in two files, intentionally short enough to read in one sitting. If you tweak `BUFF_SIZE`, remember that the arena aligns to the requested size so powers of two generally perform best.

The source and documentation live at [github.com/jonahmer22/arena](https://github.com/jonahmer22/arena). Feel free to adapt it for your own projects and send improvements back my way.
