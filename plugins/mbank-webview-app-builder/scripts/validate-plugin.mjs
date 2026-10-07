import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'

const root = await realpath(fileURLToPath(new URL('..', import.meta.url)))
const problems = []
const expectedSkills = [
  'webview-app-builder',
  'webview-project-bootstrap',
  'webview-ui-builder',
  'webview-form-builder',
  'webview-navigation-builder',
  'webview-bridge-builder',
  'webview-debugger',
]
const readJson = async (relative) => {
  try {
    return JSON.parse(await readFile(path.join(root, relative), 'utf8'))
  } catch (error) {
    problems.push(`${relative}: ${error.message}`)
    return {}
  }
}
const inside = (location) => {
  const relative = path.relative(root, location)
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  )
}
const walk = async (directory) => {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) {
      problems.push(
        `${path.relative(root, filename)}: symlinks are not packaged resources`,
      )
    } else if (entry.isDirectory()) {
      files.push(...(await walk(filename)))
    } else {
      files.push(filename)
    }
  }
  return files
}

const manifest = await readJson('plugin.json')
if (
  manifest.$schema !==
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
)
  problems.push('plugin.json: portable schema is required')
if (manifest.name !== path.basename(root))
  problems.push('plugin.json: name must match package directory')
if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.version ?? ''))
  problems.push('plugin.json: version must be a release version')
if (!manifest.description?.trim())
  problems.push('plugin.json: description is required')
const interfaceMetadata = manifest.extensions?.['com.openai']?.interface
if (!interfaceMetadata?.displayName || !interfaceMetadata.shortDescription)
  problems.push('plugin.json: install-surface display metadata is missing')
for (const dependency of ['apps', 'mcpServers', 'hooks']) {
  if (manifest[dependency] || manifest.extensions?.['com.openai']?.[dependency])
    problems.push(
      `plugin.json: unexpected ${dependency} dependency in this skills-only package`,
    )
}

const source = await readJson('template-source.json')
if (source.schemaVersion !== 1)
  problems.push('template-source.json: unsupported schemaVersion')
for (const field of ['repository', 'ref']) {
  if (
    source[field] !== null &&
    (typeof source[field] !== 'string' || !source[field].trim())
  )
    problems.push(
      `template-source.json: ${field} must be null or a nonempty string`,
    )
}
if (Boolean(source.repository) !== Boolean(source.ref))
  problems.push('template-source.json: configure repository and ref together')
if (!['yarn', 'npm', 'pnpm'].includes(source.packageManager))
  problems.push(
    'template-source.json: packageManager must be yarn, npm or pnpm',
  )
if (
  !Array.isArray(source.verificationScripts) ||
  source.verificationScripts.length === 0 ||
  source.verificationScripts.some(
    (name) =>
      typeof name !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(name) ||
      ['dev', 'start', 'preview'].includes(name),
  )
)
  problems.push(
    'template-source.json: verificationScripts must list check/build script names',
  )

const folders = (
  await readdir(path.join(root, 'skills'), { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
if (
  folders.length !== expectedSkills.length ||
  expectedSkills.some((name) => !folders.includes(name))
)
  problems.push('skills/: expected the seven documented skills')
for (const name of expectedSkills) {
  const entrypoint = `skills/${name}/SKILL.md`
  try {
    const content = await readFile(path.join(root, entrypoint), 'utf8')
    const metadata = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
    )?.[1]
    if (!metadata || !new RegExp(`^name: ${name}$`, 'm').test(metadata))
      problems.push(`${entrypoint}: matching frontmatter name is required`)
    if (!metadata || !/^description: .+/m.test(metadata))
      problems.push(`${entrypoint}: description is required`)
    if (/\[TODO[^\]]*\]|TODO:|TBD|PLACEHOLDER/.test(content))
      problems.push(`${entrypoint}: unfinished scaffold instruction`)
    if (
      content.includes('docs/webview-app-builder/') ||
      content.includes('/Users/')
    )
      problems.push(`${entrypoint}: depends on the authoring workspace`)
    const yaml = await readFile(
      path.join(root, `skills/${name}/agents/openai.yaml`),
      'utf8',
    )
    if (!yaml.includes(`$${name}`))
      problems.push(
        `${name}/agents/openai.yaml: default prompt must invoke the skill`,
      )
    const shortDescription = yaml.match(
      /^\s+short_description: ["'](.+)["']$/m,
    )?.[1]
    if (
      !shortDescription ||
      shortDescription.length < 25 ||
      shortDescription.length > 64
    )
      problems.push(
        `${name}/agents/openai.yaml: short description must be 25–64 characters`,
      )
  } catch (error) {
    problems.push(`${entrypoint}: ${error.message}`)
  }
}

const files = await walk(root)
let linkCount = 0
for (const filename of files.filter((name) => name.endsWith('.md'))) {
  const content = await readFile(filename, 'utf8')
  for (const match of content.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    const href = match[1]
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(href)) continue
    const target = path.resolve(
      path.dirname(filename),
      decodeURIComponent(href.split('#')[0]),
    )
    linkCount += 1
    if (!inside(target)) {
      problems.push(
        `${path.relative(root, filename)}: resource escapes package: ${href}`,
      )
      continue
    }
    try {
      await stat(target)
      if (!inside(await realpath(target)))
        problems.push(
          `${path.relative(root, filename)}: resource resolves outside package: ${href}`,
        )
    } catch {
      problems.push(
        `${path.relative(root, filename)}: missing resource: ${href}`,
      )
    }
  }
}

for (const relative of [
  'scripts/bootstrap-project.mjs',
  'docs/bootstrap.md',
  'docs/component-creation.md',
  'docs/template-access.md',
]) {
  try {
    await stat(path.join(root, relative))
  } catch {
    problems.push(`Missing required resource: ${relative}`)
  }
}

if (problems.length) {
  for (const problem of problems) process.stderr.write(`${problem}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(
    `Valid package: ${manifest.name}@${manifest.version}; ${expectedSkills.length} skills; ${linkCount} local resource links.\n`,
  )
  if (!source.repository)
    process.stdout.write(
      'Template source is intentionally unset; configure repository and ref before real project bootstrap.\n',
    )
}
