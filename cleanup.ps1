# 🧹 FocusGuard Repository Cleanup Script (PowerShell)
# Run this before deployment to clean up unnecessary files

Write-Host "🧹 Starting FocusGuard Repository Cleanup..." -ForegroundColor Cyan

# Files to keep private (already in .gitignore but double-check)
$privateFiles = @(
    "LINKEDIN.md",
    ".env",
    "serv/.env",
    "client/focusguard-dashboard/.env"
)

Write-Host "`n📋 Checking private files are not tracked..." -ForegroundColor Yellow
foreach ($file in $privateFiles) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        $status = git ls-files $file 2>$null
        if ($status) {
            Write-Host "  ⚠️  WARNING: $file is tracked by git!" -ForegroundColor Red
            Write-Host "     Run: git rm --cached $file" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ $file is not tracked" -ForegroundColor Green
        }
    }
}

# Remove common cruft
Write-Host "`n🗑️  Removing temporary files..." -ForegroundColor Yellow

$cleanupPatterns = @(
    "__pycache__",
    "*.pyc",
    "*.pyo",
    "*.log",
    ".pytest_cache",
    ".mypy_cache",
    "node_modules",
    ".vite",
    "dist",
    "build",
    "*.tmp",
    "*.temp",
    ".DS_Store",
    "Thumbs.db",
    "Desktop.ini"
)

$cleaned = 0
foreach ($pattern in $cleanupPatterns) {
    $items = Get-ChildItem -Path . -Recurse -Force -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        try {
            Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
            $cleaned++
            Write-Host "  🗑️  Removed: $($item.FullName)" -ForegroundColor Gray
        } catch {
            Write-Host "  ⚠️  Could not remove: $($item.FullName)" -ForegroundColor Red
        }
    }
}
Write-Host "  ✅ Cleaned $cleaned items" -ForegroundColor Green

# Check for large files that shouldn't be committed
Write-Host "`n📦 Checking for large files..." -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Path . -Recurse -File | Where-Object { $_.Length -gt 5MB }
if ($largeFiles) {
    Write-Host "  ⚠️  WARNING: Large files found (>5MB):" -ForegroundColor Red
    foreach ($file in $largeFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "     - $($file.FullName) ($sizeMB MB)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✅ No large files found" -ForegroundColor Green
}

# Verify .env.example files exist
Write-Host "`n📝 Verifying .env.example files..." -ForegroundColor Yellow
$envExamples = @(
    ".env.example",
    ".env.production.example",
    "serv/.env.example",
    "client/focusguard-dashboard/.env.example"
)
foreach ($file in $envExamples) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  MISSING: $file" -ForegroundColor Red
    }
}

# Check for TODO/FIXME in critical files
Write-Host "`n🔍 Scanning for TODO/FIXME comments..." -ForegroundColor Yellow
$todos = git grep -n "TODO\|FIXME\|XXX\|HACK" -- '*.py' '*.ts' '*.tsx' 2>$null
if ($todos) {
    Write-Host "  ⚠️  Found TODO comments (review before deployment):" -ForegroundColor Yellow
    Write-Host $todos -ForegroundColor Gray
} else {
    Write-Host "  ✅ No critical TODO comments found" -ForegroundColor Green
}

# Summary
Write-Host "`n✨ Cleanup Complete!" -ForegroundColor Cyan
Write-Host "`n📋 Pre-Deployment Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] All .env files are gitignored" -ForegroundColor White
Write-Host "  [ ] No large binary files committed" -ForegroundColor White
Write-Host "  [ ] All .env.example files present" -ForegroundColor White
Write-Host "  [ ] TODO comments reviewed" -ForegroundColor White
Write-Host "  [ ] Tests passing: cd serv; pytest -v" -ForegroundColor White
Write-Host "  [ ] Frontend builds: cd client/focusguard-dashboard; npm run build" -ForegroundColor White
Write-Host "  [ ] Docker images build successfully" -ForegroundColor White
Write-Host "`nRun: git status" -ForegroundColor Cyan
