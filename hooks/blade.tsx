import type { ClientModule } from 'claude-code'

// The closing line: the hilt, then the blade igniting once and staying lit.
type Props = { text: string; time: string; blade: string; hilt: string; ignite: boolean }
type State = { length: number }

const BLADE = 7
const STEP_MS = 60

const Blade: ClientModule<Props, State> = (props, surface) => {
  const { Text } = surface.elements
  if (surface.state === undefined) {
    surface.setState({ length: props.ignite ? 0 : BLADE })
    if (props.ignite) {
      const stop = surface.every(STEP_MS, () => {
        const length = (surface.state?.length ?? 0) + 1
        surface.setState({ length })
        if (length >= BLADE) stop()
      })
    }
  }
  const length = surface.state?.length ?? BLADE

  return (
    <Text>
      <Text color={props.hilt}>▬▬ι</Text>
      <Text color={props.blade}>{'═'.repeat(length).padEnd(BLADE)}</Text>
      <Text color={props.blade}>  {props.text}</Text>
      <Text dimColor> · {props.time}</Text>
    </Text>
  )
}

export default Blade
