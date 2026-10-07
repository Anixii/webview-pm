import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'

const script = fileURLToPath(
  new URL('./bootstrap-project.mjs', import.meta.url),
)

function command(name, args, cwd) {
  const result = spawnSync(name, args, {
    cwd,
    encoding: 'utf8',
    timeout: 60_000,
  })
  assert.equal(result.status, 0, `${name}: ${result.stderr}`)
  return result.stdout.trim()
}

async function fixture(
  t,
  { failedCheck = false, noSource = false, unsafeSymlink = false } = {},
) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'webview-bootstrap-test-'),
  )
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const source = path.join(root, 'source')
  const plugin = path.join(root, 'plugin')
  const target = path.join(root, 'project')
  await fs.mkdir(source)
  await fs.mkdir(path.join(plugin, 'scripts'), { recursive: true })
  await fs.copyFile(
    script,
    path.join(plugin, 'scripts', 'bootstrap-project.mjs'),
  )
  const pkg = {
    name: 'offline-webview-fixture',
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      postinstall: 'node scripts/fixture.mjs install',
      'lint:type': 'node scripts/fixture.mjs check',
      build: `node scripts/fixture.mjs ${failedCheck ? 'fail' : 'build'}`,
    },
  }
  await fs.writeFile(
    path.join(source, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`,
  )
  await fs.writeFile(
    path.join(source, 'package-lock.json'),
    `${JSON.stringify(
      {
        name: pkg.name,
        version: pkg.version,
        lockfileVersion: 3,
        requires: true,
        packages: {
          '': { name: pkg.name, version: pkg.version, hasInstallScript: true },
        },
      },
      null,
      2,
    )}\n`,
  )
  await fs.mkdir(path.join(source, 'scripts'))
  await fs.writeFile(
    path.join(source, 'scripts', 'fixture.mjs'),
    `import { writeFileSync, mkdirSync } from 'node:fs';
const step = process.argv[2];
if (step === 'fail') process.exit(9);
if (step === 'build') { mkdirSync('dist', { recursive: true }); writeFileSync('dist/index.html', '<main>Built</main>'); }
else writeFileSync('.' + step + '-result', 'complete');
`,
  )
  const included = [
    'src/example.ts',
    'src/plugin.json',
    'docs/useful.md',
    '.env.example',
    '.env.production.example',
    '.env.example.local',
    '.yarnrc.yml',
  ]
  const excluded = [
    '.env',
    '.env.production',
    '.aws/credentials',
    'node_modules/secret.txt',
    'dist/old.html',
    'build/old.txt',
    '.codex/skills/internal/SKILL.md',
    '.agents/internal.md',
    'AGENT_FEEDBACK.md',
    'AGENTS.md',
    'plugins/example/.codex-plugin/plugin.json',
    'plugins/example/docs/internal.md',
    'plugins/portable/plugin.json',
    'plugins/portable/docs/internal.md',
  ]
  for (const name of [...included, ...excluded]) {
    await fs.mkdir(path.dirname(path.join(source, name)), { recursive: true })
    await fs.writeFile(path.join(source, name), name)
  }
  await fs.writeFile(
    path.join(source, 'src/plugin.json'),
    JSON.stringify({ name: 'application-runtime-plugin' }),
  )
  await fs.writeFile(
    path.join(source, 'plugins/portable/plugin.json'),
    JSON.stringify({
      $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
      name: 'portable-agent-plugin',
      version: '1.0.0',
    }),
  )
  if (unsafeSymlink)
    await fs.symlink('../outside-secret', path.join(source, 'unsafe'))
  await fs.writeFile(
    path.join(root, 'outside-secret'),
    'secret value should never appear',
  )
  command('git', ['init', '--quiet'], source)
  command('git', ['config', 'user.email', 'fixture@example.invalid'], source)
  command('git', ['config', 'user.name', 'Bootstrap Fixture'], source)
  command('git', ['add', '--all'], source)
  command('git', ['commit', '--quiet', '-m', 'Offline fixture'], source)
  const commit = command('git', ['rev-parse', 'HEAD'], source)
  command('git', ['tag', 'v1.0.0'], source)
  await fs.writeFile(
    path.join(plugin, 'template-source.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        repository: noSource ? null : source,
        ref: noSource ? null : commit,
        packageManager: 'npm',
        verificationScripts: ['lint:type', 'build'],
      },
      null,
      2,
    )}\n`,
  )
  return { root, source, plugin, target, commit, included, excluded }
}

function bootstrap(f, args = [], cwd = f.root, environment = {}) {
  return spawnSync(
    process.execPath,
    [
      path.join(f.plugin, 'scripts', 'bootstrap-project.mjs'),
      '--target',
      f.target,
      ...args,
    ],
    {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      env: {
        ...process.env,
        npm_config_offline: 'true',
        npm_config_cache: path.join(f.root, 'npm-cache'),
        ...environment,
      },
    },
  )
}

async function exists(filename) {
  try {
    await fs.lstat(filename)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

test('empty folder becomes an installed, checked project using config independent of cwd', async (t) => {
  const f = await fixture(t)
  await fs.mkdir(f.target)
  const result = bootstrap(f, [], f.source)
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(
    await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
  )
  assert.equal(status.status, 'ready')
  assert.equal(status.source.resolvedCommit, f.commit)
  assert.equal(status.source.repository, f.source)
  assert.equal(status.install.status, 'complete')
  assert.deepEqual(status.install.args, ['ci', '--no-audit', '--no-fund'])
  assert.equal(
    status.verification.every((entry) => entry.status === 'complete'),
    true,
  )
  assert.equal(
    await fs.readFile(path.join(f.target, '.install-result'), 'utf8'),
    'complete',
  )
  assert.equal(
    await fs.readFile(path.join(f.target, '.check-result'), 'utf8'),
    'complete',
  )
  assert.equal(
    await fs.readFile(path.join(f.target, 'dist/index.html'), 'utf8'),
    '<main>Built</main>',
  )
  for (const name of f.included)
    assert.equal(await exists(path.join(f.target, name)), true, name)
  for (const name of [...f.excluded, '.git'])
    assert.equal(await exists(path.join(f.target, name)), false, name)
})

test('populated folder is refused without modifying any content', async (t) => {
  const f = await fixture(t)
  await fs.mkdir(f.target)
  await fs.writeFile(path.join(f.target, '.DS_Store'), 'preserve')
  const result = bootstrap(f)
  assert.equal(result.status, 2)
  assert.match(result.stderr, /not empty/)
  assert.deepEqual(await fs.readdir(f.target), ['.DS_Store'])
  assert.equal(
    await fs.readFile(path.join(f.target, '.DS_Store'), 'utf8'),
    'preserve',
  )
})

test('bootstrap from inside the empty workspace preserves its directory identity and completes installation', async (t) => {
  const f = await fixture(t)
  await fs.mkdir(f.target)
  const before = await fs.stat(f.target)
  const result = bootstrap(f, [], f.target)
  assert.equal(result.status, 0, result.stderr)
  const after = await fs.stat(f.target)
  if (process.platform !== 'win32') {
    assert.equal(after.ino, before.ino)
    assert.equal(after.dev, before.dev)
  }
  const status = JSON.parse(
    await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
  )
  assert.equal(status.status, 'ready')
  assert.equal(status.copy.status, 'complete')
  assert.equal(status.install.status, 'complete')
  assert.equal(
    await fs.readFile(path.join(f.target, '.install-result'), 'utf8'),
    'complete',
  )
})

test('unset template source stops with actionable configuration message', async (t) => {
  const f = await fixture(t, { noSource: true })
  const result = bootstrap(f)
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Template source is not configured/)
  assert.match(result.stderr, /--repository and --ref/)
  assert.equal(await exists(f.target), false)
})

test('ref options cannot inject Git arguments or revision expressions', async (t) => {
  const f = await fixture(t)
  for (const ref of [
    '-oops',
    'HEAD~1',
    'refs/heads/main',
    'name with spaces',
    'tag..bad',
  ]) {
    const result = bootstrap(f, ['--ref', ref])
    assert.equal(result.status, 2, ref)
    assert.equal(await exists(f.target), false, ref)
  }
})

test('verification failure preserves the project and failed provenance; rerun refuses overwrite', async (t) => {
  const f = await fixture(t, { failedCheck: true })
  const result = bootstrap(f)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /project is preserved/)
  const status = JSON.parse(
    await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
  )
  assert.equal(status.status, 'failed')
  assert.equal(status.install.status, 'complete')
  assert.deepEqual(
    status.verification.map(({ status: state }) => state),
    ['complete', 'failed'],
  )
  assert.equal(await exists(path.join(f.target, 'src/example.ts')), true)
  assert.equal(bootstrap(f).status, 2)
  assert.deepEqual(
    JSON.parse(
      await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
    ),
    status,
  )
})

test('copy-only resolves a tag to its exact commit and skips install/checks', async (t) => {
  const f = await fixture(t, { noSource: true })
  const result = bootstrap(f, [
    '--repository',
    f.source,
    '--ref',
    'v1.0.0',
    '--copy-only',
  ])
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(
    await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
  )
  assert.equal(status.source.requestedRef, 'v1.0.0')
  assert.equal(status.source.resolvedCommit, f.commit)
  assert.equal(status.status, 'copied')
  assert.equal(status.install.status, 'skipped')
  assert.equal(await exists(path.join(f.target, '.install-result')), false)
})

test('unsafe symlink is refused before the destination is created', async (t) => {
  const f = await fixture(t, { unsafeSymlink: true })
  const result = bootstrap(f, ['--copy-only'])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /symlink/)
  assert.equal(await exists(f.target), false)
  assert.equal(result.stdout.includes('secret value'), false)
})

test('credential-bearing repository URL is refused without echoing credentials', async (t) => {
  const f = await fixture(t)
  const result = bootstrap(f, [
    '--repository',
    'https://secret-token@example.invalid/repo.git',
    '--copy-only',
  ])
  assert.equal(result.status, 2)
  assert.match(result.stderr, /credentials/)
  assert.equal(result.stderr.includes('secret-token'), false)
  assert.equal(await exists(f.target), false)
})

test('portable Agent Plugin packages are excluded while runtime plugin.json files remain', async (t) => {
  const f = await fixture(t)
  const result = bootstrap(f, ['--copy-only'])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(await exists(path.join(f.target, 'plugins/portable')), false)
  assert.equal(await exists(path.join(f.target, 'plugins/example')), false)
  assert.deepEqual(
    JSON.parse(
      await fs.readFile(path.join(f.target, 'src/plugin.json'), 'utf8'),
    ),
    {
      name: 'application-runtime-plugin',
    },
  )
  assert.equal(await exists(path.join(f.target, 'src/example.ts')), true)
})

test('a filesystem error during publication preserves partial files, unrelated additions, and failed copy status', async (t) => {
  const f = await fixture(t)
  const faultHook = path.join(f.root, 'copy-fault.mjs')
  await fs.writeFile(
    faultHook,
    `import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import process from 'node:process';
const original = fs.copyFile;
fs.copyFile = async (...args) => {
  if (args[1] === path.join(process.env.FIXTURE_TARGET, 'src/example.ts')) {
    await fs.writeFile(path.join(process.env.FIXTURE_TARGET, 'untouched.txt'), 'unrelated addition');
    const error = new Error('Injected copy failure');
    error.code = 'EACCES';
    throw error;
  }
  return original(...args);
};
syncBuiltinESMExports();
`,
  )
  const result = bootstrap(f, ['--copy-only'], f.root, {
    NODE_OPTIONS: `--import=${pathToFileURL(faultHook).href}`,
    FIXTURE_TARGET: f.target,
  })
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /partial project/)
  const status = JSON.parse(
    await fs.readFile(path.join(f.target, '.webview-template.json'), 'utf8'),
  )
  assert.equal(status.status, 'failed')
  assert.equal(status.copy.status, 'failed')
  assert.equal(status.install.status, 'skipped')
  assert.equal(await exists(path.join(f.target, 'package.json')), true)
  assert.equal(
    await fs.readFile(path.join(f.target, 'untouched.txt'), 'utf8'),
    'unrelated addition',
  )
  assert.equal(bootstrap(f).status, 2)
})
