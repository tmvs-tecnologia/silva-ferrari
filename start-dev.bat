@echo off
cd /d "%~dp0"
node "%~dp0node_modules\next\dist\bin\next" dev --turbopack
