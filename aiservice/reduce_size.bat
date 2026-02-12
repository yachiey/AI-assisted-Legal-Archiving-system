@echo off
echo.
echo ===================================================
echo Reducing AI Service Size (Removing Unused Bloat)
echo ===================================================
echo.
echo Current Torch Size: ~3GB (CUDA Enabled)
echo Target Torch Size: ~200MB (CPU Only)
echo.
echo 1. Uninstalling current heavy packages...
.\aiservice_env\Scripts\pip uninstall -y torch torchvision torchaudio

echo.
echo 2. Installing optimized CPU-only packages...
.\aiservice_env\Scripts\pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo 3. Cleaning pip cache...
.\aiservice_env\Scripts\pip cache purge

echo.
echo ===================================================
echo DONE! The aiservice folder should now be much smaller.
echo ===================================================
pause
