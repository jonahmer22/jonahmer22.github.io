---
title: Why Interpret Assembly?
date: 2025-09-26
summary: Why would I start another project just to interpret an infamously low-level language in a high-level manner?
---
## Turning assembly into a playground
I'm building Lexi-Lang because the usual path for trying ideas in assembly is far slower than it should be. As much as I enjoy working close to the metal, standing up toolchains, assemblers, and emulators just to validate a control-flow trick or stack discipline eats up whole nights. The project is still in its infancy, but the goal is to create a tight loop: write the instructions in a flexible syntax, feed them through a parser and compiler, and immediately watch them execute in a small virtual machine. Even at this early stage, framing the sandbox has already given me a safe place to sketch instruction semantics before I commit to a real ISA or hardware build.

## Architecture in miniature
Lexi-Lang is specced to mirror the shape of a simple 16-bit CPU so experiments feel authentic without forcing me to model everything:
- **Registers:** eight general-purpose 16-bit registers (`R0`-`R7`), an `ACC` accumulator that every arithmetic and logic opcode targets, plus `SP` and `PC` for the stack and instruction stream. That gives me 11 registers to juggle state the same way I would on a real board once the implementation lands.
- **Memory:** a 64 KiB word-addressable space with a full-descending stack driven by `SP`. Pushes decrement, pops increment; just like the machines I want to emulate.
- **Instructions:** the core set will cover data movement, math on the accumulator, bitwise logic, control flow, and a few specials like `HLT` and `NOP`. `MOV PC, Rs` opens the door to computed jumps and self-modifying code when I need to test gnarlier ideas.

## Parser, compiler, virtual machine
I'm drafting the toolchain as a handwritten parser that feeds a compact compiler and a virtual machine. The shape is there: parse the custom assembly, emit 16-bit opcodes from a compiler (possibly into an output file as an option), and let the VM maintain the register file, update `PC` between instructions, and mutate the stack in lockstep with the memory model. Each component is still under construction, but keeping the three pieces in one codebase means I can iterate fast as soon as the first instructions execute end to end.

## Countdown in Lexi-Lang
A tiny program from the README sums up the ergonomics:

```asm
    MOV R0, #5      ; start value
    MOV ACC, R0

loop:
    DEC             ; ACC--
    JLZ done        ; if ACC < 0, jump to done
    JMP loop        ; repeat

done:
    HLT
```

With only general-purpose registers, an accumulator, and a pair of jump instructions, I can sketch the same countdown logic I would try on real silicon. Getting this to run end to end is one of my next checkpoints, the interpreter will handle the bookkeeping so I can focus on the instruction behavior.

## From prototype to ISA replicas
The long-term plan is to reuse this sandbox to script out replicas of real architectures: think a RISC-style core, an x86_32 subset, or whatever new ISA catches my attention. By starting with a malleable interpreter, I can iterate on instruction encodings, play with status flags, and prove out calling conventions before investing in a cycle-accurate emulator or HDL. Lexi-Lang is the bridge between an idea scribbled on paper and a fully specified ISA, even if the bridge is still being built plank by plank.

## What comes next
Short term I want richer debugging hooks; stepping, register diffs, and memory watch windows to make experiments faster. Past that, I plan to extend the compiler so it can assemble macros and emit disassemblies. Each of those pieces moves me closer to the goal that kicked off this project: making assembly exploration quick enough that trying a new instruction set feels like another evening project, not a multi-week slog.
