# Start JIMBO HQ Dashboard
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "  Starting JIMBO HQ Dashboard..." -ForegroundColor Cyan
Write-Host "  http://localhost:4200" -ForegroundColor Green
Write-Host ""
python server.py 4200
