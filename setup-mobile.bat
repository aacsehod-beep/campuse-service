@echo off
echo Creating CampusHub mobile app directory structure...

set BASE=%~dp0mobile

mkdir "%BASE%"
mkdir "%BASE%\app"
mkdir "%BASE%\app\(auth)"
mkdir "%BASE%\app\(tabs)"
mkdir "%BASE%\app\orders"
mkdir "%BASE%\components"
mkdir "%BASE%\components\ui"
mkdir "%BASE%\components\orders"
mkdir "%BASE%\components\layout"
mkdir "%BASE%\store"
mkdir "%BASE%\hooks"
mkdir "%BASE%\lib"
mkdir "%BASE%\types"
mkdir "%BASE%\assets"
mkdir "%BASE%\assets\images"

echo.
echo Done! Directory structure created.
echo Now run the mobile app setup as instructed.
pause
