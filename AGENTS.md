# AGENTS.md

Hyperspace is a Claude Code mod (plugin, install name `hyperspace`). It swaps the spinner's words for space-opera ones, flies stars past them, and lights a blade on the line that shows how long a turn took. It only changes what is drawn. It does not change what Claude does.

## Layout

- `hooks/register.tsx`: the mod's entry point. Word lists (`WORDS`, `DONE`), colours, and the `ui.render` handlers for `Spinner` and `TurnDuration`.
- `hooks/stars.tsx`: client module for the spinner line (stars, word, seconds so far).
- `hooks/blade.tsx`: client module for the closing line (hilt, blade igniting, text, time).
- `hooks/hooks.json`: lists `./register.tsx` as the module.
- `tests/words.test.tsx`: checks the word lists and renders both surfaces.
- `.claude-plugin/`: `plugin.json`, `marketplace.json`, `icon.png`, and `types/` (type declarations for the `claude-code` module that `tsconfig.json` extends).
- `assets/`: images for the README and social preview.

## How it works

- Spinner: `WORDS` is keyed by spinner mode (`thinking`, `requesting`, `responding`, `tool-use`, `tool-input`). One word is picked per mode per turn and kept in a map that resets on `prompt.submit`, so the text does not flicker.
- Stars: on a client surface, `stars.tsx` cycles four frames every 250 ms and counts seconds from the turn start. Without a client surface the handler only swaps the `word` prop.
- Blade: `TurnDuration` shows a phrase from `DONE`, the duration, and the local time. `blade.tsx` grows the blade 7 characters in 60 ms steps. Only the first draw ignites; redraws show it lit. Without a client surface it falls back to plain `Text`.
- It steps aside while a `retro-chat` skin is on, and when `hyperspace` is `false` in `.claude/mods/switches.json` (re-read every 3 seconds).

## Checks

Run from the repo root:

```
claude plugin test .
npx -y -p typescript@5.6.3 tsc --noEmit -p .
claude plugin validate .
```

The plugin test should report 2 passed, 0 failed. `tsc` should print nothing.

## Conventions

- TypeScript with TSX, no build step. Types come from `.claude-plugin/types/`.
- Plain, short comments above each block explaining what it does.
- Colours are 256-colour safe hex values, defined as constants at the top of `register.tsx`.
- Randomness is only used to pick words. Everything else is deterministic.
- Add or change a line of text in `WORDS` or `DONE` and the tests cover it automatically.

## No trademark names

Keep every file free of franchise trademark names, including misspellings. Use generic words such as "blade", "space-opera" and "hyperspace". The banned list is in `tests/words.test.tsx`; extend it rather than working around it.
