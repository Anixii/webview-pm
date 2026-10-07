#!/usr/bin/env node
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const markerName = '.webview-template.json'
const managers = new Set(['yarn', 'npm', 'pnpm'])

class BootstrapError extends Error {
  constructor(message, exitCode = 1) {
    super(message)
    this.exitCode = exitCode
  }
}

function parseArgs(argv) {
  const options = {}
  const values = new Set(['target', 'repository', 'ref', 'package-manager'])
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--copy-only' || arg === '--help') {
      options[arg.slice(2)] = true
      continue
    }
    if (!arg.startsWith('--') || !values.has(arg.slice(2))) {
      throw new BootstrapError(
        'Unknown argument. Use --help for the supported options.',
        2,
      )
    }
    const key = arg.slice(2)
    if (
      options[key] !== undefined ||
      !argv[i + 1] ||
      argv[i + 1].startsWith('--')
    ) {
      throw new BootstrapError(`Provide one value for --${key}.`, 2)
    }
    options[key] = argv[++i]
  }
  if (!options.help && !options.target) {
    throw new BootstrapError(
      'Provide --target with the empty folder to prepare.',
      2,
    )
  }
  return options
}

function help() {
  process.stdout.write(`Prepare an empty folder from a pinned WebView template.

Usage: node bootstrap-project.mjs --target PATH [options]

  --repository URL|PATH       Git repository; overrides template-source.json
  --ref COMMIT|TAG            Full 40-character commit or existing Git tag
  --package-manager MANAGER   yarn, npm, or pnpm; requires its lockfile
  --copy-only                Copy files without installing or running checks
  --help                     Show this help

Defaults come from the plugin's template-source.json, independent of cwd.
The default operation copies, installs locked dependencies, and runs checks.
Existing files are never overwritten. A failed install/check keeps the project
and its .webview-template.json status; repair it in place instead of bootstrapping
over it. This command does not start a server or initialize the target's Git repo.
`)
}

async function readConfig(options) {
  let config
  try {
    config = JSON.parse(
      await fs.readFile(path.join(pluginRoot, 'template-source.json'), 'utf8'),
    )
  } catch (error) {
    if (error.code === 'ENOENT') {
      config = {
        schemaVersion: 1,
        repository: null,
        ref: null,
        packageManager: 'yarn',
        verificationScripts: ['lint:type', 'build'],
      }
    } else {
      throw new BootstrapError(
        'Cannot read template-source.json. Check that it is valid JSON.',
        2,
      )
    }
  }
  if (!config || typeof config !== 'object' || config.schemaVersion !== 1) {
    throw new BootstrapError(
      'template-source.json must use schemaVersion 1.',
      2,
    )
  }
  const repository = options.repository ?? config.repository
  const ref = options.ref ?? config.ref
  if (!repository || !ref) {
    throw new BootstrapError(
      'Template source is not configured. Set repository and ref in template-source.json, or provide --repository and --ref. Use the approved GitHub URL and a full commit SHA; no source is inferred from the current project.',
      2,
    )
  }
  const packageManager = options['package-manager'] ?? config.packageManager
  if (!managers.has(packageManager)) {
    throw new BootstrapError(
      'Choose yarn, npm, or pnpm in packageManager or --package-manager.',
      2,
    )
  }
  const verificationScripts = config.verificationScripts ?? [
    'lint:type',
    'build',
  ]
  if (
    !Array.isArray(verificationScripts) ||
    verificationScripts.length === 0 ||
    verificationScripts.some(
      (name) =>
        typeof name !== 'string' ||
        !/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(name) ||
        ['dev', 'start', 'preview'].includes(name),
    )
  ) {
    throw new BootstrapError(
      'verificationScripts must contain check/build script names; dev, start, and preview are not allowed.',
      2,
    )
  }
  return {
    repository: validateRepository(repository),
    ref: validateRef(ref),
    packageManager,
    verificationScripts,
  }
}

function validateRepository(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.startsWith('-') ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new BootstrapError(
      'Repository must be a Git URL or local path without control characters or option prefixes.',
      2,
    )
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    let url
    try {
      url = new URL(value)
    } catch {
      throw new BootstrapError('Repository URL is invalid.', 2)
    }
    if (
      !['https:', 'ssh:', 'file:'].includes(url.protocol) ||
      /\s/.test(value)
    ) {
      throw new BootstrapError(
        'Use an HTTPS or SSH Git URL, or a local Git path.',
        2,
      )
    }
    if (
      url.password ||
      url.search ||
      url.hash ||
      (url.protocol === 'https:' && url.username)
    ) {
      throw new BootstrapError(
        'Do not place credentials, query parameters, or fragments in the repository URL. Use the environment Git authentication.',
        2,
      )
    }
    return value
  }
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+:[^\s]+$/.test(value)) return value
  // Local fixtures and explicitly supplied local mirrors use absolute paths.
  return path.resolve(value)
}

function validateRef(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.startsWith('-') ||
    /[\x00-\x20\x7f]/.test(value)
  ) {
    throw new BootstrapError(
      'Ref must be a full commit SHA or a Git tag, without option prefixes or whitespace.',
      2,
    )
  }
  if (/^[a-f0-9]{40}$/i.test(value))
    return { requested: value, fetch: value, commit: true }
  const tag = value.startsWith('refs/tags/')
    ? value.slice('refs/tags/'.length)
    : value
  if (
    !tag ||
    value.startsWith('refs/heads/') ||
    value.startsWith('refs/remotes/') ||
    /[~^:?*[\\]/.test(tag) ||
    tag.includes('..') ||
    tag.includes('@{') ||
    tag.includes('//') ||
    tag.startsWith('/') ||
    tag.endsWith('/') ||
    tag
      .split('/')
      .some(
        (part) =>
          !part ||
          part.startsWith('.') ||
          part.endsWith('.') ||
          part.endsWith('.lock'),
      )
  ) {
    throw new BootstrapError(
      'Ref must be a full commit SHA or an existing Git tag. Branches and revision expressions are not accepted.',
      2,
    )
  }
  return { requested: value, fetch: `refs/tags/${tag}`, commit: false }
}

function run(command, args, cwd, label, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: { ...process.env, CI: '1', GIT_TERMINAL_PROMPT: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const output = []
    let outputBytes = 0
    child.stdout.on('data', (chunk) => {
      if (!capture) return
      outputBytes += chunk.length
      // Only Git metadata and --version output are consumed. Avoid retaining
      // arbitrary package-script output or accidentally printing credentials.
      if (outputBytes <= 16 * 1024 * 1024) output.push(chunk)
    })
    child.stderr.on('data', () => {})
    child.once('error', (error) => {
      reject(
        new BootstrapError(
          error.code === 'ENOENT'
            ? `${command} is unavailable. Make it available in this environment, then retry ${label}. The bootstrap does not install global tools.`
            : `Could not run ${label}. Check execution permissions for ${command}.`,
        ),
      )
    })
    child.once('close', (code, signal) => {
      if (code !== 0) {
        reject(
          new BootstrapError(
            `${label} failed (${signal ? `signal ${signal}` : `exit ${code}`}). Command output is suppressed to avoid exposing credentials; inspect the command locally for details.`,
          ),
        )
      } else if (outputBytes > 16 * 1024 * 1024) {
        reject(
          new BootstrapError(
            `${label} produced too much metadata to process safely.`,
          ),
        )
      } else {
        resolve(Buffer.concat(output).toString('utf8'))
      }
    })
  })
}

async function ensureEmpty(target) {
  try {
    const stat = await fs.lstat(target)
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new BootstrapError(
        'Target must be an ordinary empty directory, not a file or symlink.',
        2,
      )
    }
    if ((await fs.readdir(target)).length > 0) {
      throw new BootstrapError(
        'Target is not empty. Choose an empty folder; existing files, including Git metadata and hidden files, will not be overwritten.',
        2,
      )
    }
    await fs.access(target, constants.W_OK)
  } catch (error) {
    if (error.code === 'ENOENT') return
    if (error instanceof BootstrapError) throw error
    throw new BootstrapError(
      'Cannot access the target folder. Check permissions.',
      2,
    )
  }
}

function safeTrackedPath(relative) {
  if (
    !relative ||
    relative.includes('\\') ||
    relative.includes('\0') ||
    path.posix.isAbsolute(relative) ||
    relative
      .split('/')
      .some(
        (part) => !part || part === '.' || part === '..' || part.includes(':'),
      )
  )
    throw new BootstrapError(
      'The template contains a path that cannot be exported safely.',
    )
  return relative
}

function excluded(relative, pluginFolders) {
  const parts = relative.split('/')
  if (
    parts.some((part) =>
      [
        '.git',
        'node_modules',
        'dist',
        'build',
        '.aws',
        '.codex',
        '.agents',
        '.codex-plugin',
      ].includes(part),
    )
  )
    return true
  if (
    parts.some(
      (part) =>
        part === '.env' ||
        (part.startsWith('.env.') &&
          !/^\.env\.(?:example(?:\..+)?|.+\.example)$/.test(part)),
    )
  )
    return true
  if (['AGENTS.md', 'AGENT_FEEDBACK.md', markerName].includes(relative))
    return true
  return pluginFolders.some(
    (folder) => relative === folder || relative.startsWith(`${folder}/`),
  )
}

async function exportTemplate(source, commit, stage) {
  const tree = await run(
    'git',
    ['ls-tree', '-r', '-z', '--full-tree', commit],
    source,
    'Reading template files',
    true,
  )
  const entries = tree
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t')
      const [mode, type] = line.slice(0, tab).split(' ')
      const relative = safeTrackedPath(line.slice(tab + 1))
      if (mode === '160000' || type === 'commit')
        throw new BootstrapError(
          'The template uses Git submodules. Export a self-contained template before bootstrapping.',
        )
      if (!['100644', '100755', '120000'].includes(mode) || type !== 'blob')
        throw new BootstrapError(
          'The template contains an unsupported file type.',
        )
      return { mode, relative }
    })
  const pluginFolders = entries
    .filter(({ relative }) => relative.endsWith('/.codex-plugin/plugin.json'))
    .map(({ relative }) =>
      relative.slice(0, -'/.codex-plugin/plugin.json'.length),
    )
  for (const { mode, relative } of entries) {
    if (mode === '120000' || !relative.endsWith('/plugin.json')) continue
    let manifest
    try {
      manifest = JSON.parse(
        await run(
          'git',
          ['show', `${commit}:${relative}`],
          source,
          'Reading a nested plugin manifest',
          true,
        ),
      )
    } catch {
      // A runtime plugin.json may use an unrelated format. Preserve those files.
      continue
    }
    if (
      typeof manifest?.$schema === 'string' &&
      /^https:\/\/agent-plugins\.org\/schemas\/\d+\.\d+\.\d+\/plugin\.schema\.json$/.test(
        manifest.$schema,
      )
    ) {
      pluginFolders.push(path.posix.dirname(relative))
    }
  }
  const copied = entries.filter(
    ({ relative }) => !excluded(relative, pluginFolders),
  )
  await run(
    'git',
    ['checkout', '--detach', commit],
    source,
    'Checking out the pinned template',
  )
  const sourceRoot = await fs.realpath(source)
  const stagedPaths = new Set(copied.map(({ relative }) => relative))
  for (const { mode, relative } of copied) {
    const sourceFile = path.join(source, relative)
    const targetFile = path.join(stage, relative)
    await fs.mkdir(path.dirname(targetFile), { recursive: true })
    if (mode === '120000') {
      const link = await fs.readlink(sourceFile)
      const linkedPath = path.posix.normalize(
        path.posix.join(path.posix.dirname(relative), link),
      )
      let resolved
      try {
        resolved = await fs.realpath(sourceFile)
      } catch {
        throw new BootstrapError('The template contains a broken symlink.')
      }
      if (
        path.isAbsolute(link) ||
        link.includes('\\') ||
        !resolved.startsWith(`${sourceRoot}${path.sep}`) ||
        (!stagedPaths.has(linkedPath) &&
          ![...stagedPaths].some((name) => name.startsWith(`${linkedPath}/`)))
      )
        throw new BootstrapError(
          'The template contains a symlink that leaves the source or refers to excluded files.',
        )
      await fs.symlink(link, targetFile)
    } else {
      await fs.copyFile(sourceFile, targetFile, constants.COPYFILE_EXCL)
      await fs.chmod(targetFile, mode === '100755' ? 0o755 : 0o644)
    }
  }
}

async function packageDetails(stage, config, copyOnly) {
  let pkg
  try {
    pkg = JSON.parse(
      await fs.readFile(path.join(stage, 'package.json'), 'utf8'),
    )
  } catch {
    throw new BootstrapError(
      'The selected template must contain a valid root package.json.',
    )
  }
  if (copyOnly) return pkg
  const declared =
    typeof pkg.packageManager === 'string'
      ? pkg.packageManager.split('@')[0]
      : null
  if (declared && declared !== config.packageManager) {
    throw new BootstrapError(
      'The template packageManager does not match the selected manager. Select its manager explicitly and use the matching lockfile.',
      2,
    )
  }
  const lockfile = {
    yarn: 'yarn.lock',
    npm: 'package-lock.json',
    pnpm: 'pnpm-lock.yaml',
  }[config.packageManager]
  try {
    await fs.access(path.join(stage, lockfile))
  } catch {
    throw new BootstrapError(
      `The template is missing ${lockfile}. Commit the matching lockfile before installing dependencies.`,
      2,
    )
  }
  if (
    config.verificationScripts.some(
      (name) => typeof pkg.scripts?.[name] !== 'string',
    )
  ) {
    throw new BootstrapError(
      'The template is missing a configured verification script. Update verificationScripts to the actual type-check and build scripts.',
      2,
    )
  }
  return pkg
}

async function managerDetails(stage, config, pkg) {
  const version = (
    await run(
      config.packageManager,
      ['--version'],
      stage,
      'Checking the package manager',
      true,
    )
  ).trim()
  const major = Number(version.match(/^(\d+)\./)?.[1])
  if (!Number.isInteger(major))
    throw new BootstrapError('Could not identify the package-manager version.')
  const declaredVersion = pkg.packageManager?.match(
    /^(?:yarn|npm|pnpm)@(\d+)\./,
  )?.[1]
  if (declaredVersion && Number(declaredVersion) !== major) {
    throw new BootstrapError(
      'The installed package-manager major version does not match package.json. Use the template’s declared version before retrying.',
      2,
    )
  }
  return {
    version,
    args:
      config.packageManager === 'yarn'
        ? [
            'install',
            ...(major === 1
              ? ['--frozen-lockfile', '--non-interactive']
              : ['--immutable']),
          ]
        : config.packageManager === 'npm'
          ? ['ci', '--no-audit', '--no-fund']
          : ['install', '--frozen-lockfile'],
  }
}

async function writeMarker(marker, provenance) {
  const data = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`)
  await marker.truncate(0)
  let offset = 0
  while (offset < data.length) {
    const { bytesWritten } = await marker.write(
      data,
      offset,
      data.length - offset,
      offset,
    )
    if (bytesWritten === 0)
      throw new BootstrapError('Could not record bootstrap status.')
    offset += bytesWritten
  }
  await marker.sync()
}

async function copyStagedDirectory(stage, target) {
  const entries = await fs.readdir(stage, { withFileTypes: true })
  for (const entry of entries) {
    const sourceFile = path.join(stage, entry.name)
    const targetFile = path.join(target, entry.name)
    if (entry.isDirectory()) {
      // Exclusive creation also protects directories added by another process.
      await fs.mkdir(targetFile)
      await copyStagedDirectory(sourceFile, targetFile)
    } else if (entry.isSymbolicLink()) {
      await fs.symlink(await fs.readlink(sourceFile), targetFile)
    } else if (entry.isFile()) {
      await fs.copyFile(sourceFile, targetFile, constants.COPYFILE_EXCL)
      await fs.chmod(targetFile, (await fs.stat(sourceFile)).mode & 0o777)
    } else {
      throw new BootstrapError('Staging contains an unsupported file type.')
    }
  }
}

async function publishStage(stage, target, provenance, publication) {
  await ensureEmpty(target)
  try {
    await fs.mkdir(target)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
  await ensureEmpty(target)
  // Preserve the opened workspace directory's identity and current working
  // directories. Claim only the status file, then create every entry exclusively.
  publication.marker = await fs.open(path.join(target, markerName), 'wx', 0o600)
  publication.claimed = true
  provenance.status = 'copying'
  provenance.copy.status = 'running'
  await writeMarker(publication.marker, provenance)
  if ((await fs.readdir(target)).some((name) => name !== markerName)) {
    throw new BootstrapError(
      'The target changed before copying. Existing files are preserved; inspect the folder before continuing.',
    )
  }
  try {
    await copyStagedDirectory(stage, target)
  } catch {
    throw new BootstrapError(
      'Copying staged template files failed. The partial project and existing destination files are preserved; inspect the recorded status before continuing.',
    )
  }
  provenance.copy.status = 'complete'
  provenance.status = 'copied'
  await writeMarker(publication.marker, provenance)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    help()
    return
  }
  if (Number(process.versions.node.split('.')[0]) < 18)
    throw new BootstrapError(
      'Node.js 18 or newer is required. Use the template’s supported Node.js version.',
    )
  const config = await readConfig(options)
  const target = path.resolve(options.target)
  await ensureEmpty(target)
  await run('git', ['--version'], process.cwd(), 'Checking Git')
  if (!config.ref.commit)
    await run(
      'git',
      ['check-ref-format', config.ref.fetch],
      process.cwd(),
      'Validating the Git tag',
    )
  let temporary
  let stage
  let provenance
  const publication = { claimed: false, marker: null }
  try {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'webview-template-'))
    await run(
      'git',
      ['init', '--quiet'],
      temporary,
      'Creating a temporary Git checkout',
    )
    await run(
      'git',
      ['remote', 'add', 'origin', config.repository],
      temporary,
      'Configuring the template source',
    )
    await run(
      'git',
      ['fetch', '--quiet', '--depth', '1', 'origin', config.ref.fetch],
      temporary,
      'Retrieving the pinned template; check source access and ref',
    )
    const commit = (
      await run(
        'git',
        ['rev-parse', '--verify', 'FETCH_HEAD^{commit}'],
        temporary,
        'Resolving the template commit',
        true,
      )
    ).trim()
    if (
      !/^[a-f0-9]{40}$/.test(commit) ||
      (config.ref.commit &&
        commit.toLowerCase() !== config.ref.requested.toLowerCase())
    ) {
      throw new BootstrapError(
        'The fetched template did not resolve to the requested commit.',
      )
    }
    // Download completes before creating or changing the destination folder.
    await fs.mkdir(path.dirname(target), { recursive: true })
    stage = await fs.mkdtemp(path.join(path.dirname(target), '.webview-stage-'))
    await exportTemplate(temporary, commit, stage)
    const pkg = await packageDetails(stage, config, options['copy-only'])
    const manager = options['copy-only']
      ? null
      : await managerDetails(stage, config, pkg)
    provenance = {
      schemaVersion: 1,
      source: {
        repository: config.repository,
        requestedRef: config.ref.requested,
        resolvedCommit: commit,
      },
      createdAt: new Date().toISOString(),
      packageManager: config.packageManager,
      packageManagerVersion: manager?.version ?? null,
      status: 'copied',
      copy: { status: 'pending' },
      install: {
        status: options['copy-only'] ? 'skipped' : 'pending',
        args: manager?.args ?? [],
      },
      verification: config.verificationScripts.map((script) => ({
        script,
        status: options['copy-only'] ? 'skipped' : 'pending',
      })),
    }
    await publishStage(stage, target, provenance, publication)
    if (options['copy-only']) {
      process.stdout.write(
        `Template copied to ${target}\nCommit: ${commit}\nInstallation and verification were skipped (--copy-only).\n`,
      )
      return
    }
    process.stdout.write(
      `Template copied to ${target}\nCommit: ${commit}\nInstalling dependencies with ${config.packageManager}…\n`,
    )
    provenance.install.status = 'running'
    await writeMarker(publication.marker, provenance)
    await run(
      config.packageManager,
      manager.args,
      target,
      'Installing locked dependencies',
    )
    provenance.install.status = 'complete'
    await writeMarker(publication.marker, provenance)
    for (const check of provenance.verification) {
      check.status = 'running'
      await writeMarker(publication.marker, provenance)
      await run(
        config.packageManager,
        ['run', check.script],
        target,
        `Verification script ${check.script}`,
      )
      check.status = 'complete'
      await writeMarker(publication.marker, provenance)
      process.stdout.write(`Passed: ${check.script}\n`)
    }
    provenance.status = 'ready'
    await writeMarker(publication.marker, provenance)
    process.stdout.write(
      `Project ready. Source and check results are recorded in ${markerName}.\n`,
    )
  } catch (error) {
    if (publication.claimed && provenance) {
      provenance.status = 'failed'
      if (provenance.copy.status === 'running')
        provenance.copy.status = 'failed'
      if (provenance.install.status === 'running')
        provenance.install.status = 'failed'
      for (const check of provenance.verification)
        if (check.status === 'running') check.status = 'failed'
      provenance.failure =
        error instanceof BootstrapError
          ? error.message
          : 'Bootstrap failed; inspect the project locally.'
      try {
        await writeMarker(publication.marker, provenance)
      } catch {
        /* Preserve the project even if status writing fails. */
      }
      process.stderr.write(
        `The project is preserved at ${target}. Repair the failed step in place; do not rerun bootstrap into this folder.\n`,
      )
    }
    throw error
  } finally {
    if (publication.marker) await publication.marker.close()
    if (stage) await fs.rm(stage, { recursive: true, force: true })
    if (temporary) await fs.rm(temporary, { recursive: true, force: true })
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof BootstrapError ? error.message : 'Bootstrap failed. Check filesystem permissions and the template configuration.'}\n`,
  )
  process.exitCode = error instanceof BootstrapError ? error.exitCode : 1
})
