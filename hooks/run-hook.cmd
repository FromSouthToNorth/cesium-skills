: << 'CMDBLOCK'
@echo off
REM 钩子脚本的跨平台多语言包装器。
REM 在 Windows 上：cmd.exe 运行批处理部分，该部分查找并调用 bash。
REM 在 Unix 上：shell 将其解释为脚本（: 在 bash 中是无操作）。
REM
REM 用法：run-hook.cmd <脚本名称> [参数...]

if "%~1"=="" (
    echo run-hook.cmd: 缺少脚本名称 >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

REM 在标准位置中尝试 Git for Windows 的 bash
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM 尝试 PATH 上的 bash（例如用户安装的 Git Bash、MSYS2、Cygwin）
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM 未找到 bash —— 静默退出而非报错
REM （插件仍可正常工作，只是没有 SessionStart 上下文注入）
exit /b 0
CMDBLOCK

# Unix：直接运行指定脚本
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
