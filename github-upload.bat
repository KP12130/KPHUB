@echo off
set /p build=<version.txt
set /a build=%build%+1
echo %build% > version.txt

echo === FRISSITES INDITASA (#%build%) ===

git add .
git commit -m "Update #%build%"
git push

echo === KESZ! Verzio: #%build% ===