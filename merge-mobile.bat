@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo  CampusHub Mobile App - Merge Script
echo ========================================
echo.

REM Get the current worktree
for /f "tokens=1" %%A in ('git worktree list ^| findstr /R "agents-mobile-app"') do (
    set "TOPIC_DIR=%%A"
)

REM Get the main worktree
for /f "tokens=1" %%A in ('git worktree list ^| findstr /R "^[^(].*[^()]$" ^| findstr /V "agents-mobile-app"') do (
    set "MAIN_DIR=%%A"
)

if not defined TOPIC_DIR (
    echo ERROR: Could not find topic branch worktree
    pause
    exit /b 1
)

if not defined MAIN_DIR (
    echo ERROR: Could not find main worktree
    pause
    exit /b 1
)

echo [1/5] Committing changes in topic branch...
cd /d "%TOPIC_DIR%"
git add -A
git rm --cached mobile\test.txt 2>nul
git commit -m "feat: add React Native mobile app (Expo SDK 51 + Expo Router v3)" -m "- mobile/ directory: full Expo app with NativeWind, Zustand, Socket.io" -m "- Screens: Auth, Feed, Create, Orders, Chat, Profile, Wallet, Notifications" -m "- EAS Build config for APK (preview) and AAB (production)" -m "- Backend: refresh token endpoint + CORS update for mobile clients" -m "- Root package.json: mobile dev/build scripts" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if errorlevel 1 (
    echo ERROR: Commit failed
    pause
    exit /b 1
)

echo [2/5] Switching to main worktree...
cd /d "%MAIN_DIR%"

echo [3/5] Merging topic branch into main...
git merge agents-mobile-app-design-and-conversion

if errorlevel 1 (
    echo ERROR: Merge conflict detected. Please resolve manually.
    pause
    exit /b 1
)

echo [4/5] Verifying merge...
git merge-base --is-ancestor agents-mobile-app-design-and-conversion HEAD

if errorlevel 1 (
    echo ERROR: Merge verification failed
    pause
    exit /b 1
)

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
echo Main worktree: !MAIN_DIR!
echo Topic worktree: !TOPIC_DIR!
echo.
pause
