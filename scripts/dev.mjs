// Chạy `next dev` và để Node tin chứng chỉ HTTPS dev của BE (.NET), tránh lỗi 500 "self-signed certificate"
// khi Next chuyển tiếp /api sang https://localhost:7000. Không đụng vào kho chứng chỉ của hệ điều hành.
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const certPath = resolve('.certs', 'aspnet-dev.pem')

// Chỉ xuất chứng chỉ công khai (không có khoá riêng); cần .NET SDK trên máy dev
if (!existsSync(certPath)) {
  mkdirSync(resolve('.certs'), { recursive: true })
  const result = spawnSync(
    'dotnet',
    ['dev-certs', 'https', '--export-path', certPath, '--format', 'Pem'],
    { stdio: 'inherit' }
  )
  if (result.status !== 0)
    console.warn(
      '[dev] Không xuất được chứng chỉ dev; /api có thể báo lỗi 500 nếu BE dùng HTTPS tự ký.'
    )
}

const env = { ...process.env }
if (existsSync(certPath) && !env.NODE_EXTRA_CA_CERTS) env.NODE_EXTRA_CA_CERTS = certPath

const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next')
const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3000', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
})
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
