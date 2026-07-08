# Execute como Administrador (clique direito > Executar como administrador)
# Contorna cache NXDOMAIN do roteador/hotspot para subdomínios novos.

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$serverIp = "157.173.119.218"
$entries = @(
    "admin-dev.logistica-processo.com",
    "pwa-dev.logistica-processo.com",
    "gestao-dev.logistica-processo.com",
    "operacao-dev.logistica-processo.com"
)

$marker = "# lilog-hub-dev"
$content = Get-Content $hostsPath -Raw -ErrorAction Stop

if ($content -notmatch [regex]::Escape($marker)) {
    $block = "`n$marker`n"
    foreach ($entry in $entries) {
        $block += "$serverIp`t$entry`n"
    }
    Add-Content -Path $hostsPath -Value $block -Encoding ASCII
    Write-Host "Entradas adicionadas ao hosts."
} else {
    Write-Host "Entradas lilog-hub-dev ja existem no hosts."
}

ipconfig /flushdns | Out-Null
Write-Host "DNS local atualizado. Teste:"
Write-Host "  https://pwa-dev.logistica-processo.com"
Write-Host "  https://admin-dev.logistica-processo.com"
Write-Host "  https://api-dev.logistica-processo.com/api/docs"
