// Dùng: node --import ./scripts/register-ts.mjs scripts/<check>.mjs
import { register } from 'node:module'

register('./ts-resolve-hooks.mjs', import.meta.url)
