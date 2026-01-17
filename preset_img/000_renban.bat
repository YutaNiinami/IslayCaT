@rem 実行したフォルダの中にある全てのpngファイルを連番リネームする。順番は適当
set N=0
for %%F in (*.png) do call :ren %%F
goto :EOF
:rdy
set /a N+=1
goto :ren %1
:ren
if %1 == %N%.png goto :EOF
if exist %N%.png goto :rdy %1
ren %1 %N%.png
set /a N+=1
goto :EOF