import type { ClientModule } from 'claude-code'

// The spinner line: stars flying out from the middle, the word, the seconds so far.
type Props = { word: string; colour: string; star: string; startMs: number }
type State = { tick: number }

const TICK_MS = 250
const FRAMES = ['   ✦   ', '  ·✦·  ', ' · ✦ · ', '·  ✦  ·']

const Stars: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  if (surface.state === undefined) {
    surface.setState({ tick: 0 })
    surface.every(TICK_MS, () => surface.setState({ tick: (surface.state?.tick ?? 0) + 1 }))
  }
  const tick = surface.state?.tick ?? 0
  const frame = FRAMES[tick % FRAMES.length] ?? ''
  const seconds = Math.floor((props.startMs + tick * TICK_MS) / 1000)

  return (
    <Text>
      <Text color={props.star}>{frame}</Text>
      <Text color={props.colour}> {props.word}…</Text>
      <Text dimColor> {seconds}s</Text>
    </Text>
  )
}

export default Stars
