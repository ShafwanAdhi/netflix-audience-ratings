param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9][A-Za-z0-9-]*$')][string]$Owner,
  [ValidateSet('private','public')][string]$Visibility='private',
  [switch]$CreateRemote
)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$config=Get-Content -LiteralPath (Join-Path $repoRoot 'project.json') -Raw | ConvertFrom-Json
$repository="$Owner/$($config.repository)"
Push-Location -LiteralPath $repoRoot
try {
  python scripts/github_preflight.py
  if ($LASTEXITCODE -ne 0) { throw 'GitHub preflight failed.' }
  if (-not $CreateRemote) {
    Write-Host "Prepared: $repository ($Visibility). No remote was created."
    Write-Host 'Review the source and initial commit first; use -CreateRemote only when ready.'
    return
  }
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI, run gh auth login, or follow docs/GITHUB.md for browser setup.' }
  git rev-parse --verify HEAD *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Create and review the initial commit first; see docs/GITHUB.md.' }
  gh auth status
  if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first. Do not paste credentials into source files.' }
  gh repo create $repository "--$Visibility" --source . --remote origin --push
  if ($LASTEXITCODE -ne 0) { throw 'GitHub creation/push failed. Inspect the output before retrying.' }
} finally { Pop-Location }
