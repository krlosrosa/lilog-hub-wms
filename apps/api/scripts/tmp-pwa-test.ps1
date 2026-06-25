$body = '{"id":421932,"password":"123456"}'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $body -WebSession $session
Write-Host "LOGIN USER:" ($login.user | ConvertTo-Json -Compress)
$me = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -WebSession $session
Write-Host "ME:" ($me | ConvertTo-Json -Compress)
$demandas = Invoke-RestMethod -Uri "http://localhost:3001/api/recebimentos/operador/demandas?unidadeId=UN-SEED-001" -WebSession $session
Write-Host "DEMANDAS:" ($demandas | ConvertTo-Json -Depth 5)
