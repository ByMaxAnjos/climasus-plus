import { cp, mkdtemp, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const debug = process.argv.includes('--debug')
const profile = debug ? 'debug' : 'release'
const archMap = {
  arm64: 'aarch64',
  x64: 'x86_64',
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        PATH: ['/opt/homebrew/bin', process.env.PATH].filter(Boolean).join(':'),
        ...extraEnv,
      },
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function main() {
  const tauriConfig = await readJson(path.join(root, 'src-tauri', 'tauri.conf.json'))
  const arch = archMap[process.arch] ?? process.arch
  const productName = tauriConfig.productName
  const version = tauriConfig.version
  const bundleDir = path.join(root, 'src-tauri', 'target', profile, 'bundle')
  const appPath = path.join(bundleDir, 'macos', `${productName}.app`)
  const dmgPath = path.join(bundleDir, 'macos', `${productName}_${version}_${arch}.dmg`)
  const dmgScript = path.join(bundleDir, 'dmg', 'bundle_dmg.sh')
  const iconPath = path.join(bundleDir, 'dmg', 'icon.icns')

  console.log(`\n[climasus+] building macOS ${profile} app bundle`)
  await run('npx', ['-y', '@tauri-apps/cli@^2', 'build', ...(debug ? ['--debug'] : []), '--bundles', 'app'])

  await stat(appPath)
  await stat(dmgScript)
  await stat(iconPath)
  await rm(dmgPath, { force: true })

  const stageDir = await mkdtemp(path.join(os.tmpdir(), 'climasus-macos-dmg-'))
  try {
    const stagedApp = path.join(stageDir, `${productName}.app`)
    console.log(`\n[climasus+] staging ${productName}.app for DMG packaging`)
    await cp(appPath, stagedApp, { recursive: true })

    console.log(`\n[climasus+] packaging DMG with --skip-jenkins`)
    await run(dmgScript, [
      '--volname', productName,
      '--volicon', iconPath,
      '--app-drop-link', '420', '170',
      '--skip-jenkins',
      dmgPath,
      stageDir,
    ])
  } finally {
    await rm(stageDir, { recursive: true, force: true })
  }

  console.log(`\n[climasus+] app: ${appPath}`)
  console.log(`[climasus+] dmg: ${dmgPath}`)
}

main().catch((error) => {
  console.error(`\n[climasus+] build failed: ${error.message}`)
  process.exit(1)
})
