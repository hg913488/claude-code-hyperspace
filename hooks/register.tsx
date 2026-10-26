import type { EngineInterface, Register } from 'claude-code'

// Spinner words by what the turn is doing.
export const WORDS = {
  thinking: ['Consulting the ancient archives', 'Reading the stars', 'Meditating on it', 'Searching the outer systems'],
  requesting: ['Sending a transmission to the core worlds', 'Decoding the stolen plans', 'Receiving a transmission'],
  responding: ['Sending a transmission to the core worlds', 'Decoding the stolen plans', 'Receiving a transmission'],
  'tool-use': [
    'Making the jump to lightspeed',
    "Making the smuggler's run",
    'Navigating the asteroid field',
    'Recalibrating the nav computer',
    'Firing up the starfighter',
    'Bypassing the hyperdrive motivator',
  ],
  'tool-input': ['Plotting a course', 'Punch it'],
} as const

// The closing line reads "<words> 34s".
export const DONE = ["Made the smuggler's run in", 'Jumped to hyperspace in', 'Flew the asteroid field in', 'Hid out on the ice planet for', 'Outran the patrol in']

// Hyperspace blue, and a lighter blue for the stars (both 256-colour safe).
const BLUE = '#0087FF'
const STAR = '#5FAFFF'
const GRAY = '#8A8A8A'

const pick = (list: readonly string[]) => list[Math.floor(Math.random() * list.length)] ?? list[0] ?? ''

// The local clock's offset, since the sandbox's own clock may not be local.
let offsetMs = 0

// retro-chat's skin, when that mod is installed: while a skin is on, it draws the
// spinner and the closing line, so hyperspace steps aside. Read while drawing, so
// /skin off brings the hyperspace back at once.
const SKIN = { plugin: 'retro-chat', key: 'skin' } as const
async function skinIsOn($: EngineInterface) {
  const { value } = await $.state.get(SKIN as never).catch(() => ({ value: undefined }))
  return value !== undefined && value !== 'off'
}

// The /mods switchboard turns this mod off in every chat with switches.json.
let off = false
async function readSwitch($: EngineInterface) {
  let nowOff = off
  try {
    const path = `${$.plugin.root.split('/.claude/')[0] ?? ''}/.claude/mods/switches.json`
    nowOff = (await $.fs.exists(path)) && (JSON.parse(String(await $.fs.read(path))) as Record<string, unknown>)['hyperspace'] === false
  } catch {
    // A broken file changes nothing.
  }
  if (nowOff === off) return
  off = nowOff
  $.ui.invalidate('ui.render')
}

async function readOffset($: EngineInterface) {
  const zone = await $.process.run(['date', '+%z'])
  const match = zone.stdout.trim().match(/^([+-])(\d{2})(\d{2})$/)
  if (match) offsetMs = (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) * 60_000
}

// 5:24 PM, from a local-shifted time.
function clock12(at: Date) {
  const hours = at.getUTCHours() % 12 || 12
  return `${hours}:${String(at.getUTCMinutes()).padStart(2, '0')} ${at.getUTCHours() < 12 ? 'AM' : 'PM'}`
}

// 34s, 1m 4s
function duration(ms: number) {
  const seconds = Math.round(ms / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export const register: Register = on => {
  // One word per mode per turn, so the spinner does not flicker between words.
  let chosen = new Map<string, string>()
  let turnStart = 0
  // Each closing line keeps its words and time when it redraws.
  const doneLines = new Map<string, { words: string; at: string }>()

  on('session.start', async ($, e, next) => {
    await readOffset($)
    await readSwitch($)
    $.clock.every(3000, () => void readSwitch($))

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    chosen = new Map()
    turnStart = await $.clock.now()

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (off || (await skinIsOn($))) return next(e)
    const mode = e.props.mode
    const word = chosen.get(mode) ?? pick(WORDS[mode])
    chosen.set(mode, word)

    const ui = $.ui.resolve(e)
    if (!('Client' in ui)) return next({ ...e, props: { ...e.props, word } })

    const { Client } = ui
    const text = e.props.message ?? word
    const startMs = turnStart === 0 ? 0 : (await $.clock.now()) - turnStart

    return (
      <Client
        key="stars"
        module="./stars.tsx"
        props={{ word: text, colour: BLUE, star: STAR, startMs }}
        width={text.length + 20}
        height={1}
      />
    )
  })

  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (off || e.props.waitingFor !== undefined || (await skinIsOn($))) return next(e)

    const id = e.requestId ?? ''
    // Only a line drawn for the first time ignites; redraws show the blade lit.
    const ignite = !doneLines.has(id)
    const line = doneLines.get(id) ?? { words: pick(DONE), at: clock12(new Date((await $.clock.now()) + offsetMs)) }
    doneLines.set(id, line)
    const text = `${line.words} ${duration(e.props.durationMs)}`
    const ui = $.ui.resolve(e)

    if (!('Client' in ui)) {
      const { Text } = ui
      return (
        <Text>
          <Text color={GRAY}>▬▬ι</Text>
          <Text color={BLUE}>═══════  {text}</Text>
          <Text dimColor> · {line.at}</Text>
        </Text>
      )
    }

    const { Client } = ui
    return (
      <Client
        key="blade"
        module="./blade.tsx"
        props={{ text, time: line.at, blade: BLUE, hilt: GRAY, ignite }}
        width={text.length + line.at.length + 16}
        height={1}
      />
    )
  })
}
