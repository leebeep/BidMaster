import os
import sys
import subprocess
import shutil
import time
from pathlib import Path

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
        "backend_encrypted",
        "dist_encrypted",
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
        
        for item_path in build_dir.rglob('*'):
            if item_path.is_file():
                relative_path = item_path.relative_to(build_dir)
                target_path = static_dir / relative_path
                
                target_path.parent.mkdir(parents=True, exist_ok=True)
                
                shutil.copy2(item_path, target_path)
    else:
        print(f"构建目录不存在: {build_dir}")
        return False
        
    print("前端构建文件已复制到后端静态目录")
    
    return True

def encrypt_backend_code():
    print("="*50)
    print("加密后端代码...")
    print("="*50)
    
    try:
        import pyarmor
        print("PyArmor已安装")
    except ImportError:
        print("安装PyArmor...")
        if not run_command(f"{sys.executable} -m pip install pyarmor"):
            print("安装PyArmor失败")
            return False
    
    backend_dir = Path("backend")
    encrypted_dir = Path("backend_encrypted")
    
    if encrypted_dir.exists():
        shutil.rmtree(encrypted_dir)
    
    print("复制后端代码到临时目录...")
    shutil.copytree(backend_dir, encrypted_dir)
    
    print("配置PyArmor加密选项...")
    pyarmor_config = """
# PyArmor 配置文件
[options]
# 启用高级加密模式
advanced_mode = 1
# 启用代码混淆
obfuscate_code = 1
# 启用字符串加密
obfuscate_string = 1
# 启用控制流混淆
obfuscate_control_flow = 1
# 启用属性重命名
obfuscate_attribute = 1
# 启用模块重命名
obfuscate_module = 1
# 启用函数重命名
obfuscate_function = 1
# 启用类重命名
obfuscate_class = 1
# 启用RASP保护
enable_rasp = 1
# 启用JIT模式
jit_mode = 1
# 启用调试保护
enable_debug_protection = 1
# 启用检查过期时间
enable_expired_check = 0
# 启用检查平台
enable_platform_check = 0
# 启用检查网络
enable_network_check = 0
# 启用检查虚拟机
enable_vm_check = 0

[runtime]
# 运行时保护模式
restrict_mode = 1
# 启用运行时检查
enable_runtime_check = 1
# 启用导入检查
enable_import_check = 1
# 启用文件检查
enable_file_check = 1
# 启用进程检查
enable_process_check = 1
"""
    
    with open("pyarmor.cfg", "w", encoding="utf-8") as f:
        f.write(pyarmor_config.strip())
    
    print("开始加密后端代码...")
    
    # 排除不需要加密的文件
    exclude_patterns = [
        "__pycache__",
        "*.pyc",
        "*.log",
        "logs/*",
        "static/*",
        "requirements.txt"
    ]
    
    exclude_args = " ".join([f"--exclude {pattern}" for pattern in exclude_patterns])
    
    # 使用PyArmor进行加密 - 由于试用版限制，只加密关键核心文件
    # 先复制整个backend目录到encrypted_dir
    print("复制后端代码到加密目录...")
    
    # 如果encrypted_dir已存在，先删除它
    if encrypted_dir.exists():
        shutil.rmtree(encrypted_dir)
    
    shutil.copytree(backend_dir, encrypted_dir)
    
    # 只加密关键的核心文件，避免试用版限制
    key_files = [
        "app/main.py",
        "app/config.py", 
        "app/services/openai_service.py",
        "app/services/duplicate_service.py",
        "app/services/search_service.py",
        "run.py"
    ]
    
    encryption_success = True
    
    for key_file in key_files:
        file_path = encrypted_dir / key_file
        if file_path.exists():
            print(f"加密关键文件: {key_file}")
            # 使用简化的加密选项，避免试用版限制
            pyarmor_cmd = f"pyarmor gen --output {encrypted_dir} --obf-module 1 --obf-code 1 {file_path}"
            
            if not run_command(pyarmor_cmd):
                print(f"加密文件失败: {key_file}")
                encryption_success = False
                break
        else:
            print(f"警告: 关键文件不存在: {key_file}")
    
    if not encryption_success:
        print("部分文件加密失败")
        return False
    
    # 清理配置文件
    if Path("pyarmor.cfg").exists():
        Path("pyarmor.cfg").unlink()
    
    print("后端代码加密完成！")
    return True

def create_encrypted_spec_file():
    print("="*50)
    print("创建加密版PyInstaller spec文件...")
    print("="*50)
    
    spec_content = """
# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path

block_cipher = None

project_root = Path.cwd()

# 包含加密后的后端代码
datas = [
    (str(project_root / 'backend_encrypted'), 'backend'),
]

# 添加PyArmor运行时依赖
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
    # PyArmor运行时依赖
    'pyarmor_runtime',
    'pyarmor_runtime.__pyarmor__',
    'pyarmor_runtime._pytransform',
]

a = Analysis(
    ['app_launcher_encrypted.py'],
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
    name='bidmaster_encrypted',
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
    
    with open("bidmaster_encrypted.spec", "w", encoding="utf-8") as f:
        f.write(spec_content.strip())
    
    print("bidmaster_encrypted.spec 已创建")
    return True

def build_encrypted_exe():
    print("="*50)
    print("构建加密版exe文件...")
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
    
    pyinstaller_cmd = "pyinstaller bidmaster_encrypted.spec"
    
    if not run_command(pyinstaller_cmd):
        print("构建加密版exe失败")
        return False
    
    # 将构建结果移动到加密目录
    dist_dir = Path("dist")
    encrypted_dist_dir = Path("dist_encrypted")
    
    if encrypted_dist_dir.exists():
        shutil.rmtree(encrypted_dist_dir)
    
    if dist_dir.exists():
        shutil.move(str(dist_dir), str(encrypted_dist_dir))
        print(f"✓ 加密版exe文件已移动到: {encrypted_dist_dir}")
    
    print("清理旧的spec文件...")
    for spec_file in Path("").glob("*.spec"):
        if spec_file.name != "bidmaster_encrypted.spec":
            try:
                spec_file.unlink()
                print(f"✓ 已删除旧的spec文件: {spec_file.name}")
            except Exception as e:
                print(f"✗ 删除旧的spec文件 {spec_file.name} 失败: {e}")
    
    print("加密版exe文件构建完成！")
    return True

def verify_encryption():
    print("="*50)
    print("验证加密结果...")
    print("="*50)
    
    encrypted_dir = Path("backend_encrypted")
    if not encrypted_dir.exists():
        print("加密目录不存在")
        return False
    
    # 检查加密文件
    py_files = list(encrypted_dir.rglob("*.py"))
    if not py_files:
        print("未找到加密的Python文件")
        return False
    
    print(f"找到 {len(py_files)} 个加密文件")
    
    # 检查加密特征
    for py_file in py_files[:5]:  # 只检查前5个文件
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                
            if "pyarmor" in content.lower() or "__pyarmor__" in content:
                print(f"✓ {py_file.relative_to(encrypted_dir)} - 已加密")
            else:
                print(f"? {py_file.relative_to(encrypted_dir)} - 加密状态未知")
        except Exception as e:
            print(f"✗ 检查文件 {py_file} 失败: {e}")
    
    # 检查exe文件
    encrypted_exe = Path("dist_encrypted") / "bidmaster_encrypted.exe"
    if encrypted_exe.exists():
        print(f"✓ 加密版exe文件存在: {encrypted_exe}")
        print(f"文件大小: {encrypted_exe.stat().st_size / (1024*1024):.2f} MB")
    else:
        print("✗ 加密版exe文件不存在")
        return False
    
    print("加密验证完成！")
    return True

def main():
    print("投标服务大师 - 加密打包脚本")
    print("="*50)
    print("注意: 此脚本将使用PyArmor对Python代码进行加密保护")
    print("="*50)
    
    start_time = time.time()
    
    if not Path("backend").exists() or not Path("frontend").exists():
        print("请在项目根目录运行此脚本")
        return False
    
    # 检查PyArmor许可证
    try:
        import pyarmor
        print("PyArmor已安装")
    except ImportError:
        print("PyArmor未安装，将自动安装...")
    
    steps = [
        ("清理构建文件", clean_build_files),
        ("构建前端", build_frontend),
        ("加密后端代码", encrypt_backend_code),
        ("创建加密版spec文件", create_encrypted_spec_file),
        ("构建加密版exe", build_encrypted_exe),
        ("验证加密结果", verify_encryption),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{'='*50}")
        print(f"步骤: {step_name}")
        print(f"{'='*50}")
        
        step_start = time.time()
        if not step_func():
            print(f"✗ {step_name} 失败")
            return False
        step_duration = time.time() - step_start
        print(f"✓ {step_name} 完成 - 耗时: {step_duration:.2f}秒")
    
    total_duration = time.time() - start_time
    
    print("\n" + "="*50)
    print("加密打包完成！")
    print("="*50)
    print(f"加密版exe文件位于: dist_encrypted/bidmaster_encrypted.exe")
    print(f"原始代码已加密保护，位于: backend_encrypted/")
    print(f"总耗时: {total_duration:.2f}秒")
    print("="*50)
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)