import { expect, mock, test } from 'claude-code/testing'

import { DONE, WORDS } from '../hooks/register'

const SURFACES = ['terminal', 'desktop'] as const

// Names that belong to someone else's films; none may appear in a line.
const BANNED = [/jedi/i, /yoda/i, /\bForce\b/, /coruscant/i, /death star/i, /kessel/i, /\bR2/, /x-wing/i, /chewie/i, /hoth/i, /\bempire\b/i, /droid/i, /sith/i, /saber/i]

test('no line uses franchise names', () => {
  const lines = [...Object.values(WORDS).flat(), ...DONE]
  for (const line of lines) for (const name of BANNED) expect(line).not.toMatch(name)
})

test('the spinner flies stars past a space word, and the closing line lights the blade', async ($, on) => {
  mock.clock(on)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '+0000\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  for (const surface of SURFACES) {
    const spinner = await $.ui.mount({
      plugin: 'hyperspace',
      surface,
      component: 'Spinner',
      requestId: 's1',
      props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' },
    })
    const stars = JSON.stringify(await spinner.drawn({ in: 'stars' }))
    expect(WORDS.thinking.some(word => stars.includes(word))).toBe(true)
    expect(stars).toContain('✦')
    await spinner.unmount()

    const done = await $.ui.mount({
      plugin: 'hyperspace',
      surface,
      component: 'TurnDuration',
      requestId: `d-${surface}`,
      props: { word: 'Cooked', durationMs: 34_000 },
    })
    const blade = JSON.stringify(await done.drawn({ in: 'blade' }))
    expect(blade).toContain('▬▬ι')
    expect(blade).toContain('34s')
    expect(DONE.some(words => blade.includes(words))).toBe(true)
    await done.unmount()
  }
})
