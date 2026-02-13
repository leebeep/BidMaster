import os
import sys
import subprocess
import shutil
from pathlib import Path
import time

def run_command(cmd, cwd=None):
    try:
        print(f"执行命令: {cmd}")
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"命令执行失败: {result.stderr}")
            return False
        print(result.stdout)
        return True
    except Exception as e:
        print(f"命令执行异常: {e}")
        return False

def clean_build_files():
    print("="*50)
    print("清理构建文件...")
    print("="*50)
    
    folders_to_clean = [
        "dist",
        "build", 
        "frontend/build",
        "backend/static",
    ]
    
    files_to_clean = [
        "*.spec",
    ]
    
    for folder in folders_to_clean:
        folder_path = Path(folder)
        if folder_path.exists():
            print(f"删除文件夹: {folder}")
            try:
                shutil.rmtree(folder_path)
                print(f"✓ 已删除 {folder}")
            except Exception as e:
                print(f"✗ 删除 {folder} 失败: {e}")
        else:
            print(f"- 文件夹不存在: {folder}")
    
    for file_pattern in files_to_clean:
        for file_path in Path(".").rglob(file_pattern):
            try:
                file_path.unlink()
                print(f"✓ 已删除文件: {file_path}")
            except Exception as e:
                print(f"✗ 删除文件 {file_path} 失败: {e}")
    
    print("清理Python缓存文件...")
    for root, dirs, files in os.walk("."):
        if "__pycache__" in dirs:
            pycache_path = Path(root) / "__pycache__"
            try:
                shutil.rmtree(pycache_path)
                print(f"✓ 已删除: {pycache_path}")
            except Exception as e:
                print(f"✗ 删除 {pycache_path} 失败: {e}")
            dirs.remove("__pycache__")
        
        for file in files:
            if file.endswith(".pyc"):
                pyc_path = Path(root) / file
                try:
                    pyc_path.unlink()
                    print(f"✓ 已删除: {pyc_path}")
                except Exception as e:
                    print(f"✗ 删除 {pyc_path} 失败: {e}")
    
    node_modules_cache = Path("frontend/node_modules/.cache")
    if node_modules_cache.exists():
        try:
            shutil.rmtree(node_modules_cache)
            print(f"✓ 已删除Node.js缓存: {node_modules_cache}")
        except Exception as e:
            print(f"✗ 删除Node.js缓存失败: {e}")
    
    print("文件清理完成！")
    return True

def build_frontend():
    print("="*50)
    print("构建前端...")
    print("="*50)
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("前端目录不存在")
        return False
    
    if not run_command("npm run build", cwd=frontend_dir):
        print("构建前端失败")
        return False
    
    build_dir = frontend_dir / "build"
    static_dir = Path("backend") / "static"
    
    if static_dir.exists():
        shutil.rmtree(static_dir)
    
    if build_dir.exists():
        static_dir.mkdir(parents=True, exist_ok=True)
        
        # 复制build目录下的所有内容到static目录
        for item_path in build_dir.rglob('*'):
            if item_path.is_file():
                # 计算相对路径
                relative_path = item_path.relative_to(build_dir)
                target_path = static_dir / relative_path
                
                # 确保目标目录存在
                target_path.parent.mkdir(parents=True, exist_ok=True)
                
                # 复制文件
                shutil.copy2(item_path, target_path)
    else:
        print(f"构建目录不存在: {build_dir}")
        return False
        
    print("前端构建文件已复制到后端静态目录")
    
    return True



def create_spec_file():
    print("="*50)
    print("创建PyInstaller spec文件...")
    print("="*50)
    
    spec_content = """
# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path

block_cipher = None

project_root = Path.cwd()

datas = [
    (str(project_root / 'backend'), 'backend'),
]

hiddenimports = [
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'uvicorn.server',
    'fastapi',
    'fastapi.staticfiles',
    'fastapi.responses',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'fastapi.routing',
    'fastapi.exceptions',
    'starlette',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.applications',
    'starlette.routing',
    'starlette.responses',
    'starlette.staticfiles',
    'starlette.types',
    'openai',
    'docx',
    'docx.oxml',
    'docx.oxml.ns',
    'PyPDF2',
    'PyPDF2.generic',
    'pdfplumber',
    'pdfplumber.page',
    'pdfplumber.table',
    'pdfplumber.utils',
    'fitz',
    'pymupdf',
    'docx2python',
    'docx2python.iterators',
    'paragraphs',
    'pydantic',
    'pydantic_settings',
    'multipart',
    'aiofiles',
    'dotenv',
    'json',
    'pathlib',
    'asyncio',
    'duckduckgo_search',
    'requests',
    'bs4',
    'beautifulsoup4',
    'playwright',
    'playwright.async_api',
    'playwright.sync_api',
    'seleniumbase',
    'seleniumbase.core',
    'seleniumbase.fixtures',
    'undetected_chromedriver',
    'asyncio_throttle',
    'aiohttp',
]

a = Analysis(
    ['app_launcher.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='bidmaster',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codepage=None,
    icon=str(project_root / 'frontend' / 'public' / 'biao.png'),
)
"""
    
    with open("bidmaster.spec", "w", encoding="utf-8") as f:
        f.write(spec_content.strip())
    
    print("bidmaster.spec 已创建")
    return True

def build_exe():
    print("="*50)
    print("构建exe文件...")
    print("="*50)
    
    print("安装构建依赖...")
    
    try:
        import pyinstaller
        print("PyInstaller已安装")
    except ImportError:
        if not run_command(f"{sys.executable} -m pip install pyinstaller"):
            print("安装PyInstaller失败")
            return False
    
    if not run_command(f"{sys.executable} -m pip install -r backend/requirements.txt"):
        print("安装应用依赖失败")
        return False
    
    pyinstaller_cmd = "pyinstaller bidmaster.spec"
    
    if not run_command(pyinstaller_cmd):
        print("构建exe失败")
        return False
    
    print("清理旧的spec文件...")
    for spec_file in Path("").glob("*.spec"):
        if spec_file.name != "bidmaster.spec":
            try:
                spec_file.unlink()
                print(f"✓ 已删除旧的spec文件: {spec_file.name}")
            except Exception as e:
                print(f"✗ 删除旧的spec文件 {spec_file.name} 失败: {e}")
    
    print("exe文件构建完成，位于 dist/ 目录中")
    return True

def main():
    print("投标服务大师 - 构建脚本")
    print("="*50)
    
    start_time = time.time()
    
    if not Path("backend").exists() or not Path("frontend").exists():
        print("请在项目根目录运行此脚本")
        return False
    
    step_start = time.time()
    if not clean_build_files():
        return False
    step_duration = time.time() - step_start
    print(f"清理构建文件耗时: {step_duration:.2f}秒")
    
    step_start = time.time()
    if not build_frontend():
        return False
    step_duration = time.time() - step_start
    print(f"构建前端耗时: {step_duration:.2f}秒")
    
    step_start = time.time()
    if not create_spec_file():
        return False
    step_duration = time.time() - step_start
    print(f"创建spec文件耗时: {step_duration:.2f}秒")
    
    step_start = time.time()
    if not build_exe():
        return False
    step_duration = time.time() - step_start
    print(f"构建exe耗时: {step_duration:.2f}秒")
    
    total_duration = time.time() - start_time
    
    print("\n" + "="*50)
    print("构建完成！")
    print("exe文件位于: dist/bidmaster.exe")
    print(f"总耗时: {total_duration:.2f}秒")
    print("="*50)
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)