// Hook phân giải module cho các script check: đọc thẳng file .ts của src (Node tự bỏ kiểu) với import không đuôi và alias `@/`.
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveFile(base) {
  for (const suffix of CANDIDATES) {
    const file = base + suffix
    if (path.extname(file) && existsSync(file)) return file
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  let base = null
  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2))
  else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL?.startsWith('file:')
  )
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
  const file = base && resolveFile(base)
  return file ? nextResolve(pathToFileURL(file).href, context) : nextResolve(specifier, context)
}
