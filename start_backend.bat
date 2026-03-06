@echo off
echo ========================================
echo  TCA IRR Backend Quick Launch (Windows)
echo ========================================

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

:: Check if pip is available
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not available
    echo Please reinstall Python with pip included
    pause
    exit /b 1
)

echo Python and pip are available
echo.

:: Run the Python launch script
python launch.py

if errorlevel 1 (
    echo.
    echo Launch failed. Please check the error messages above.
    pause
)