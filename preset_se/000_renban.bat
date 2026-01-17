@rem 実行したフォルダの中にある全てのpngファイルを連番リネームする。順番は適当
set N=0
for %%F in (*.mp3) do call :ren %%F
goto :EOF
:rdy
set /a N+=1
goto :ren %1
:ren
if %1 == %N%.mp3 goto :EOF
if exist %N%.mp3 goto :rdy %1
ren %1 %N%.mp3
set /a N+=1
goto :EOF