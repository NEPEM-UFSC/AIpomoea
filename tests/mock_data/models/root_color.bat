@echo off
REM Fake model executable for testing
REM Prints predictable results to stdout

setlocal enabledelayedexpansion

if "%1"=="--fail" (
    echo Error: Simulated failure >&2
    exit /b 1
)

for %%I in (%*) do (
    echo Image: %%I Result: test_result
)

exit /b 0
