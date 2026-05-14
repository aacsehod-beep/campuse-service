@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo  CampusHub Mobile App - Merge Script
echo ========================================
echo.

set "TOPIC_DIR=D:\rough\campuse-service.worktrees\agents-mobile-app-design-and-conversion"
set "MAIN_DIR=D:\rough\campuse-service"

echo Checking directories...
if not exist "%TOPIC_DIR%\.git" (
    echo ERROR: Topic branch not found at %TOPIC_DIR%
    pause
    exit /b 1
)

if not exist "%MAIN_DIR%\.git" (
    echo ERROR: Main worktree not found at %MAIN_DIR%
    pause
    exit /b 1
)

echo [1/5] Committing changes in topic branch...
cd /d "%TOPIC_DIR%"
git status
echo.
git add -A
echo Removing test.txt from index...
git rm --cached mobile\test.txt 2>nul
echo.
echo Committing...
git commit -m "feat: add React Native mobile app (Expo SDK 51 + Expo Router v3)" -m "- mobile/ directory: full Expo app with NativeWind, Zustand, Socket.io" -m "- Screens: Auth, Feed, Create, Orders, Chat, Profile, Wallet, Notifications" -m "- EAS Build config for APK (preview) and AAB (production)" -m "- Backend: refresh token endpoint + CORS update for mobile clients" -m "- Root package.json: mobile dev/build scripts" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if errorlevel 1 (
    echo ERROR: Commit failed
    pause
    exit /b 1
)

echo.
echo [2/5] Switching to main worktree...
cd /d "%MAIN_DIR%"
git branch -a

echo.
echo [3/5] Merging topic branch into main...
git merge agents-mobile-app-design-and-conversion

if errorlevel 1 (
    echo ERROR: Merge conflict detected. Please resolve manually.
    echo Conflicted files:
    git diff --name-only --diff-filter=U
    pause
    exit /b 1
)

echo.
echo [4/5] Verifying merge...
git log --oneline -5

echo.
echo [5/5] Pushing to origin...
git push origin main

if errorlevel 1 (
    echo ERROR: Push failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS: Merge completed!
echo ========================================
echo.
git log --oneline -3
echo.
pause
