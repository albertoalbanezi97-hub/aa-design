# Creates a "Green Convert" shortcut on the desktop pointing at the launcher
# in this same folder. Run it through "Create Desktop Shortcut.cmd".

$ErrorActionPreference = 'Stop'

try {
    $appFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
    $launcher  = Join-Path $appFolder 'Start Green Convert.cmd'
    $icon      = Join-Path $appFolder 'icons\favicon.ico'

    if (-not (Test-Path $launcher)) {
        throw "Launcher not found: $launcher"
    }

    $desktop  = [Environment]::GetFolderPath('Desktop')
    $linkPath = Join-Path $desktop 'Green Convert.lnk'

    $shell = New-Object -ComObject WScript.Shell
    $link  = $shell.CreateShortcut($linkPath)
    $link.TargetPath       = $launcher
    $link.WorkingDirectory = $appFolder
    $link.Description      = 'Green Convert - batch image converter'
    $link.WindowStyle      = 7          # start minimised
    if (Test-Path $icon) { $link.IconLocation = $icon }
    $link.Save()

    Write-Host ''
    Write-Host "Done - 'Green Convert' is now on your desktop." -ForegroundColor Green
    Write-Host "  shortcut : $linkPath"
    Write-Host "  app      : $appFolder"
}
catch {
    Write-Host ''
    Write-Host "Could not create the shortcut: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'You can make one by hand: right-click "Start Green Convert.cmd"'
    Write-Host '-> Show more options -> Send to -> Desktop (create shortcut).'
    exit 1
}
