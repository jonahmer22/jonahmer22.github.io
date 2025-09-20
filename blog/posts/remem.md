---
title: ReMem Design Notes
date: 2025-09-18
summary: Designing a lightweight garbage collector and memory recycler that keeps C allocations predictable.
---
## Why build a collector in C?
ReMem started as an experiment to see how far I could push higher-level memory conveniences without leaving the predictability of C. Writing hobby kernels, interpreters, and ML primitives made it obvious how much time gets sunk into manual allocation hygiene. I wanted a tool that felt safe enough for prototypes yet light enough to drop into systems projects without pulling in a runtime.

## Key design goals
- **Compatibility first.** ReMem avoids external dependencies so it can travel between Linux, macOS, Apple Silicon, old x86 boards, and whatever comes next.
- **Predictable performance.** By routing everything through size-classed arenas, allocations resolve in O(1) time and freed pages are recycled instead of repeatedly hitting the OS.
- **Drop-in ergonomics.** The API mirrors `malloc`/`free` so projects can adopt it incrementally, with optional hooks for rooting GC-managed pointers.

## How the arena-backed GC works
ReMem groups allocations into size classes and stores them inside arena-backed pages. When a block is freed, the collector simply marks it for reuse. Pages that drain completely are either cached in-memory (for speed) or returned to the arena depending on the `freeMemory` toggle. Page lookups, as well as the mapping from blocks to their parent arenas, stay O(1) via dense indexing tables.

Large allocations that do not fit within a standard page are shunted directly to the underlying arena. Those blocks live until the GC is destroyed, which keeps the hot path simple while still covering edge cases.

## Performance snapshot
I benchmarked the collector on both a modern Apple M3 Pro and a low-power Intel N150 laptop with a workload that touches roughly 16 GB of memory. Highlights:
- Plain `malloc/free`: ~2 s (M3 Pro) / ~4 s (Intel N150)
- ReMem with cached pages: ~3 s / ~19 s
- ReMem freeing pages back to the arena: ~3 s / ~40 s
- Python reference workload: ~38 s / ~81 s

The collector always carries a small constant overhead compared to manual memory management, but it stays far closer to native performance than higher-level runtimes. When you can tolerate a little extra RSS, disabling page freeing keeps the allocator comfortably in the "just works" zone.

## Roadmap and lessons learned
The roadmap includes a nursery for better short-lived allocation throughput and, in the long term, multithreading support. The nursery alone should deliver a 1.5-5x speed-up for GC-heavy workloads. I am also experimenting with better instrumentation so you can ask ReMem what it is doing in real time.

Building ReMem reinforced that C can still host modern tooling patterns if you lean on tight data structures and avoid branching out of hot loops. The project also nudged me to formalize my documentation process; every release is tagged, licensed under GPL v3, and ships with clear change logs.

## Example usage
```c
int main(void) {
    int stack_top;
    if (!gcInit(&stack_top, false)) {
        return 1;
    }

    int *buffer = gcAlloc(sizeof(int) * 1024);
    buffer[0] = 42;

    gcDestroy();
    return 0;
}
```

If you want to dive into the source, the project lives on [GitHub](https://github.com/jonahmer22/ReMem). Feedback, benchmarks, and pull requests are always welcome.
