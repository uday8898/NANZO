// Builds the FULL STORE version of the theme (every X.store.json becomes X.json) into .launch/
// and pushes it to Shopify as a separate, UNPUBLISHED theme. The live coming-soon theme is untouched.
//
//   node scripts/push-launch.mjs              -> create/update the "nanzo-launch" theme
//   node scripts/push-launch.mjs --check-only -> just build .launch/ and run Shopify's theme check
//
// On launch day: Shopify admin -> Online Store -> Themes -> "nanzo-launch" -> Publish.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const STORE = 'gtgrha-dp.myshopify.com'
const NAME = 'nanzo-launch'
const SRC = path.resolve('theme')
const OUT = path.resolve('.launch')
const checkOnly = process.argv.includes('--check-only')
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status || 1)
}

console.log('1/4 building theme assets…')
run('npm', ['run', 'build'])

console.log('2/4 assembling full-store theme in .launch/ …')
fs.rmSync(OUT, { recursive: true, force: true })
fs.cpSync(SRC, OUT, { recursive: true })
const tdir = path.join(OUT, 'templates')
for (const f of fs.readdirSync(tdir)) {
  if (!f.endsWith('.store.json')) continue
  fs.copyFileSync(path.join(tdir, f), path.join(tdir, f.replace('.store.json', '.json')))
  fs.rmSync(path.join(tdir, f))
}
// the coming-soon template keeps its own password layout
fs.copyFileSync(path.join(SRC, 'templates', 'password.json'), path.join(tdir, 'password.json'))

console.log('3/4 running Shopify theme check…')
run('npx', ['--yes', '@shopify/cli@latest', 'theme', 'check', '--path', '.launch', '--fail-level', 'error', '--no-color'])

if (checkOnly) process.exit(0)

console.log(`4/4 pushing to ${STORE} as unpublished theme "${NAME}" …`)
run('npx', ['--yes', '@shopify/cli@latest', 'theme', 'push', '--path', '.launch', '--store', STORE, '--unpublished', '--theme', NAME, '--no-color'])
