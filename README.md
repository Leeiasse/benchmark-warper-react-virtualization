# React Virtualization Benchmark

Independent benchmark comparing **Warper** (Rust/WASM) against **TanStack Virtual**, **react-window**, and **React Virtuoso** using real-world transaction data at 100k, 500k, and 1M rows.

## Quick Start

```bash
# 1. Start database
cp .env.example .env
docker compose up -d

# 2. Seed data (pick your volume)
cd seed && npm install
npx tsx generate.ts --count 100000   # 100k
npx tsx generate.ts --count 1000000  # 1M

# 3. Try tool
# Go to http://localhost:3000
```

## Methodology

### Fairness Guarantees

| Decision | Why |
|----------|-----|
| **Shared `TransactionRow`** | Single `React.memo` component used by ALL 4 libs. Perf differences = virtualization engine only. |
| **Pre-computed heights** | `getVariableHeight(tx)` uses metadata key count. Deterministic, no DOM measurement variance. |
| **Equivalent overscan** | 5 items for all libs. Virtuoso uses pixels (250px = 5 * 50px avg). |
| **Delta-based scroll** | Pixels-per-second via `performance.now()`. Frame drops don't slow the scroll speed. |
| **Iframe isolation** | Each lib runs in its own iframe (separate JS event loop, GC, memory). |
| **Deterministic PRNG** | Seed 42 for faker + mulberry32 for programmatic scroll targets. |
| **Non-rendering FPS** | rAF loop stores in `useRef`, throttled `setState` every 500ms for display only. |

### FPS Measurement

- `requestAnimationFrame` loop measures frame-to-frame delta
- Sliding window of 60 frames for running average
- Display updates throttled to 500ms to avoid measurement bias
- All metrics stored in `useRef` (no React re-renders in hot path)

### Scroll Modes

| Mode | Behavior |
|------|----------|
| **Slow** | 300 px/s continuous scroll (real-world reading speed) |
| **Fast** | 5000 px/s continuous scroll (stress test) |
| **Programmatic** | Random `scrollToIndex()` every 500ms, seeded PRNG |

### Variable Heights

Heights are deterministic based on the transaction's metadata key count (0-5 keys):
- 0 keys = 40px, 1 key = 50px, ..., 5 keys = 90px
- Key count formula: `(id * 7 + 3) % 6`

## Architecture

```
docker-compose.yml          PostgreSQL 16
seed/                       Data generation (faker-js + pg COPY)
api/                        Fastify REST API (port 3001)
frontend/                   React 18 + Vite
├── benchmarks/             4 benchmark components (identical structure)
├── components/             Shared UI (TransactionRow, FpsOverlay, etc.)
├── hooks/                  FPS monitor, data loader, scroll simulation
└── Dashboard.tsx           2x2 iframe grid + controls + results
```

### Dashboard Mode

The Dashboard (`/`) embeds each library in a separate iframe (`/bench/:library?embedded=true`). Communication uses `postMessage`:

1. Iframe sends `READY` when data is loaded
2. Dashboard sends `START` with scroll mode / volume / height config
3. Dashboard sends `STOP` to end benchmark
4. Iframe sends `RESULT` with FPS stats

### Standalone Mode

Navigate directly to `/bench/warper`, `/bench/tanstack`, `/bench/react-window`, or `/bench/virtuoso` for standalone benchmarking with local controls.

## Interpreting Results

- **Avg FPS > 55**: Smooth scrolling, no perceptible jank
- **Avg FPS 30-55**: Noticeable frame drops under load
- **Avg FPS < 30**: Clearly janky, poor UX

Compare the same scroll mode + volume across libraries. The `programmatic` mode is the most demanding test since it triggers full re-virtualization on each jump.

## System Requirements

- Node.js 18+
- Docker
- 8GB RAM minimum (16GB+ recommended for 1M rows)

### Reproducibility Template

When reporting results, include:
```
OS:       macOS 14 / Windows 11 / Ubuntu 24.04
CPU:      Apple M3 / Intel i7-13700K / ...
RAM:      16GB / 32GB / ...
Browser:  Chrome 131 / Firefox 134 / ...
Node:     22.x
Volume:   100k / 500k / 1M
```

## Known Trade-offs

- **Virtuoso** auto-measures DOM heights by design. When using variable heights, it has a slight measurement overhead that other libs avoid via pre-computed sizes. This is Virtuoso's philosophy (measure-first for accuracy) and is documented, not penalized.
- **Warper** WASM initialization adds ~50-200ms on first load. The `isLoading` state is excluded from benchmark timing.
- **react-window** requires `resetAfterIndex(0)` when data changes with variable heights.

## License

MIT
