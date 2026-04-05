---
title: Cortex-VM: Designing a Compiler-Friendly 64-bit Virtual Machine
date: 2026-04-05
summary: A deep dive into the ISA design, calling conventions, and engineering decisions behind building a fast, extensible VM as a language compiler target.
---
## Why build a VM instead of targeting LLVM?

When I decided I wanted a real backend for my toy language project, the obvious answer was "just target LLVM." LLVM is fantastic, but it comes with a significant complexity tax — learning the IR, the pass manager, and the quirks of the toolchain takes real time, and I wanted to stay close to the metal while keeping the whole system understandable. The other option was to target x86 directly, but then I'm writing a platform-specific backend and fighting calling conventions I didn't design.

Cortex-VM is my answer to both of those problems. It's a 64-bit virtual machine I built from scratch as a compiler target — fast enough to be useful, simple enough to understand completely, and flexible enough to grow with the language.

## Design Principles

Before writing any code I settled on a few hard rules that shaped everything that followed:

- **Word addressing only.** All registers and memory words are 64 bits. Addresses and offsets are word indices, not byte offsets. This eliminates alignment headaches and makes code generation straightforward — there's no "load a 4-byte value from an unaligned address" edge case.
- **No implicit side effects.** No condition codes, no flags register, nothing hidden. If an instruction changes state, it does so by writing to a named register. This makes dataflow analysis trivial and keeps the VM easy to reason about.
- **Flat calling convention.** The ABI supports up to 13 arguments and 13 return values in registers — no implicit stack frame, no hidden pointer arguments. Compiler writers can target it directly without wrestling with an ABI that predates their language.

## The Register File

Cortex-VM has 64 registers, each 64 bits wide:

- `r0` / `zero` — hardwired zero, reads always return 0, writes are ignored
- `r1` / `pc` — program counter
- `r2` / `sp` — stack pointer
- `r3` / `ra` — return address
- `s0`–`s13` — callee-saved (14 registers)
- `a0`–`a13` — caller-saved; used for arguments, return values, and syscall numbers
- `t0`–`t31` — temporaries (32 registers)

Having 32 temporaries in particular is a gift for a compiler: register pressure is rarely the bottleneck, and spills to the stack are genuinely rare for most function bodies.

## The ISA

All instructions are 64 bits wide. There are seven base instruction formats:

- **R-type** (`0x81`) — register ALU: `rd = ra op rb`
- **I-type** (`0x82`) — immediate ALU / jump: `rd = ra op imm32`
- **S-type** (`0x83`) — store: `mem[ra + imm36] = rb`
- **L-type** (`0x84`) — load: `rd = mem[ra + imm36]`
- **B-type** (`0x85`) — branch with 36-bit PC-relative offset
- **SYS** (`0x86`) — system: `halt`, `syscall`, `nop`, `break`

The instruction set is minimal by design. There's `add`, `sub`, `or`, `xor`, `and`, and the shift trio (`sll`, `srl`, `sra`). Branches cover `beq`, `bne`, `blt`, and `bltu`. Jumps are done through the I-type `jmp` which writes the return address into `rd` and jumps to `ra + imm`, which covers both calls and computed branches in one instruction.

A function call looks like this:

```asm
jmp ra, zero, target    ; ra = return address, jump to target
jmp zero, ra, 0         ; return: jump to address in ra
```

Clean, explicit, and compiler-friendly.

## Extensions

The base ISA is intentionally small. Two optional extensions cover the features that most programs need but that I didn't want to bake into the core:

**M Extension** — integer multiply and divide. `mul`, `mulh`, `div`, `divu`, `rem`, `remu` and their immediate variants. `mulh` produces the upper 64 bits of a 128-bit product using `__int128_t`. The assembler detects M extension instructions automatically and sets the appropriate flag in the binary header.

**F Extension** — 64-bit IEEE 754 floating point. Rather than a separate register file, float instructions reinterpret the same 64-bit registers as doubles. Float immediates in instructions are 32-bit single-precision values widened at execution; full 64-bit doubles are available by loading from the `.data` section. The extension adds arithmetic (`fadd`, `fsub`, `fmul`, `fdiv`, `fsqrt`, `fabs`, `fneg`), conversion (`ftoi`, `ftoui`, `itof`, `uitof`), and float branches (`fblt`, `fble`, `fbgt`, `fbge`).

## The Binary Format

Cortex-VM binaries have a 5-word header in big-endian 64-bit words:

- **Word 0:** Magic number (`0x2E3A434F52540001` — ".:CORT" + version 1)
- **Word 1:** File length in words
- **Word 2:** Entry point (word index of `main:`)
- **Word 3:** Extension flags (bitmask for EXT_FLOAT and EXT_M)
- **Word 4:** Data offset (absolute word index of first `.data` word, or 0)

The body is instructions followed by an optional `.data` section. Data words live in the code arena right after the last instruction, which means loading a string or constant is just a `lw` with a label address — no separate segment to manage.

## The Assembler and Disassembler

The assembler is a single-pass design with a two-pass label resolution step to handle forward references. It supports decimal, hex (`0xFF`), binary (`0b1010`), octal (`0o17`), and character literals (`'A'`, `'\n'`). The `.data` section accepts strings (null-terminated, one character per word), integers, and 64-bit float literals.

The disassembler is a full round-trip tool: given any Cortex-VM binary, it produces an assembly source file that re-assembles to a functionally equivalent binary. It detects null-terminated printable-ASCII sequences in the data section and emits them as quoted strings with proper escape sequences.

I run 42 pytest tests that specifically verify disassembler round-trip fidelity — assemble a program, disassemble the binary, re-assemble, and compare execution output.

## Syscall Interface

Rather than a full OS, the VM provides a syscall table for the things programs usually need: printing and reading integers, floats, strings, and characters; file open/read/write/close; seeded PRNG; and millisecond-precision time. The interface is simple: put the syscall number in `a13`, arguments in `a0`–`a12`, and execute `syscall`.

## Performance

At `-O3 -march=native` on modern hardware with GCC-15, Cortex-VM runs around **400 million instructions per second** — roughly comparable to a Lua interpreter. That's exactly the expected throughput for a dispatch-loop interpreter and more than fast enough to be a practical compiler target for a toy language.

## Library API

One design goal I'm glad I committed to early: Cortex-VM builds as a static library (`libcortex-vm.a`) with a simple three-function API:

```c
uint64_t *cortexAssemble(const char *source, const char *outputPath);
int cortexExecSource(const char *source);
int cortexExecBinary(const uint64_t *binary, size_t wordCount);
```

This means the compiler can call `cortexExecSource` to run code immediately, or use `cortexAssemble` to build a binary once and run it many times. Keeping the VM embeddable from the start avoids a painful refactor later.

## Where It Goes Next

Cortex-VM is now at v0.5.0 with 201 passing tests across all instruction types, extensions, syscalls, memory operations, and the disassembler. The immediate goal is to build the language frontend on top of it — a compiler that targets Cortex-VM as its backend, replacing the earlier prototype work. The flat calling convention and predictable word-addressed memory model were designed with that compiler in mind from the start, so the next step feels like snapping two purpose-built pieces together.

The VM itself still has room to grow: heap allocation support (the address space is already reserved), more syscalls, and eventually a bytecode optimization pass. But the core is solid, the spec is written, and the test suite keeps it honest.
