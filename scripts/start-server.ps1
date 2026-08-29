# PowerShell Local Static File Server for TrendWave
param(
    [int]$Port = 8080
)

$root = if (Test-Path "$PWD\index.html") { $PWD } else { Split-Path $PSScriptRoot -Parent }
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TrendWave Local Development Server" -ForegroundColor Green
Write-Host " Serving directory: $root" -ForegroundColor Yellow
Write-Host " Local URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host " Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

try {
    while ($true) {
        if (!$listener.Pending()) {
            Start-Sleep -Milliseconds 20
            continue
        }
        
        $client = $null
        $stream = $null
        
        try {
            $client = $listener.AcceptTcpClient()
            $stream = $client.GetStream()
            
            $timeout = 20
            while (!$stream.DataAvailable -and $timeout -gt 0) {
                Start-Sleep -Milliseconds 50
                $timeout--
            }
            
            if ($stream.DataAvailable) {
                $buffer = New-Object byte[] 4096
                $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
                $requestString = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
                
                $reqLines = $requestString -split "
"
                if ($reqLines.Count -gt 0) {
                    $parts = $reqLines[0] -split ' '
                    if ($parts.Length -ge 2) {
                        $path = $parts[1].TrimStart('/')
                        if ($path -match '\?') { $path = ($path -split '\?')[0] }
                        if ($path -eq '') { $path = 'index.html' }
                        
                        $localFilePath = Join-Path $root $path
                        
                        if (Test-Path -Path $localFilePath -PathType Leaf) {
                            $content = [System.IO.File]::ReadAllBytes($localFilePath)
                            $contentType = 'application/octet-stream'
                            if ($localFilePath -match '\.css$') { $contentType = 'text/css' }
                            elseif ($localFilePath -match '\.js$') { $contentType = 'application/javascript' }
                            elseif ($localFilePath -match '\.html$') { $contentType = 'text/html; charset=utf-8' }
                            
                            $headers = "HTTP/1.1 200 OK
Content-Type: $contentType
Content-Length: $($content.Length)
Connection: close

"
                            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                            $stream.Write($headerBytes, 0, $headerBytes.Length)
                            $stream.Write($content, 0, $content.Length)
                        } else {
                            $headers = "HTTP/1.1 404 Not Found
Content-Length: 0
Connection: close

"
                            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                            $stream.Write($headerBytes, 0, $headerBytes.Length)
                        }
                    }
                }
            }
        } catch {
            # Ignore transient network/read errors
        } finally {
            if ($null -ne $stream) { $stream.Close() }
            if ($null -ne $client) { $client.Close() }
        }
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
