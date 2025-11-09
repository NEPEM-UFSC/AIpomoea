@echo off
REM Fake model executable for testing
REM Prints predictable results to stdout

setlocal enabledelayedexpansion

for %%I in (%*) do (
    echo Image: %%I Result: round
)

exit /b 0
