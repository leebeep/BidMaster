"""加密版应用启动器 - 专门用于加密打包的启动文件"""
import os
import sys
from pathlib import Path

# 设置工作目录和模块路径
try:
    if getattr(sys, 'frozen', False):
        # 打包后的环境
        if hasattr(sys, '_MEIPASS'):
            # PyInstaller临时目录 - 运行时解压的文件位置
            base_dir = Path(sys._MEIPASS)
            backend_dir = base_dir / "backend"
            print(f"PyInstaller临时目录: {base_dir}")
            print(f"backend目录: {backend_dir}")
            os.chdir(backend_dir)
            sys.path.insert(0, str(backend_dir))
            
            # 在打包环境中，PyArmor运行时应该在backend目录下
            pyarmor_runtime_path = backend_dir / "pyarmor_runtime_000000"
            if pyarmor_runtime_path.exists():
                sys.path.insert(0, str(pyarmor_runtime_path))
        else:
            # 打包后的exe运行环境 - 检查同级目录的backend文件夹
            base_dir = Path(sys.executable).parent
            backend_dir = base_dir / "backend"
            if backend_dir.exists():
                print(f"在exe同级目录找到backend: {backend_dir}")
                os.chdir(backend_dir)
                sys.path.insert(0, str(backend_dir))
                
                # 在打包环境中，PyArmor运行时应该在backend目录下
                pyarmor_runtime_path = backend_dir / "pyarmor_runtime_000000"
                if pyarmor_runtime_path.exists():
                    sys.path.insert(0, str(pyarmor_runtime_path))
            else:
                print(f"ERROR: backend目录不存在: {backend_dir}")
                print(f"当前工作目录: {Path.cwd()}")
                print(f"可执行文件位置: {sys.executable}")
                input("按回车键退出...")
                sys.exit(1)
    else:
        # 开发环境 - 使用加密后的代码
        base_dir = Path(__file__).parent
        backend_dir = base_dir / "backend_encrypted"
        if backend_dir.exists():
            print(f"使用加密后的代码: {backend_dir}")
            os.chdir(backend_dir)
            sys.path.insert(0, str(backend_dir))
        else:
            print(f"ERROR: 加密后端目录不存在: {backend_dir}")
            print("请先运行 build_encrypted.py 进行加密打包")
            input("按回车键退出...")
            sys.exit(1)
except Exception as e:
    print(f"设置工作目录时出错: {e}")
    import traceback
    traceback.print_exc()
    input("按回车键退出...")
    sys.exit(1)

# PyArmor运行时已经通过binaries打包，不需要显式导入
# 运行时会自动从backend/pyarmor_runtime_000000目录加载
print("PyArmor运行时将通过binaries方式加载")

import time
import threading
import webbrowser
import signal
import atexit

# 设置工作目录和模块路径
try:
    if getattr(sys, 'frozen', False):
        # 打包后的环境
        if hasattr(sys, '_MEIPASS'):
            # PyInstaller临时目录 - 运行时解压的文件位置
            base_dir = Path(sys._MEIPASS)
            backend_dir = base_dir / "backend"
            print(f"PyInstaller临时目录: {base_dir}")
            print(f"backend目录: {backend_dir}")
            os.chdir(backend_dir)
            sys.path.insert(0, str(backend_dir))
        else:
            # 打包后的exe运行环境 - 检查同级目录的backend文件夹
            base_dir = Path(sys.executable).parent
            backend_dir = base_dir / "backend"
            if backend_dir.exists():
                print(f"在exe同级目录找到backend: {backend_dir}")
                os.chdir(backend_dir)
                sys.path.insert(0, str(backend_dir))
            else:
                print(f"ERROR: backend目录不存在: {backend_dir}")
                print(f"当前工作目录: {Path.cwd()}")
                print(f"可执行文件位置: {sys.executable}")
                input("按回车键退出...")
                sys.exit(1)
    else:
        # 开发环境 - 使用加密后的代码
        base_dir = Path(__file__).parent
        backend_dir = base_dir / "backend_encrypted"
        if backend_dir.exists():
            print(f"使用加密后的代码: {backend_dir}")
            os.chdir(backend_dir)
            sys.path.insert(0, str(backend_dir))
        else:
            print(f"ERROR: 加密后端目录不存在: {backend_dir}")
            print("请先运行 build_encrypted.py 进行加密打包")
            input("按回车键退出...")
            sys.exit(1)
except Exception as e:
    print(f"设置工作目录时出错: {e}")
    import traceback
    traceback.print_exc()
    input("按回车键退出...")
    sys.exit(1)

# 全局变量用于进程管理
uvicorn_server = None
server_thread = None
server_should_stop = False

def cleanup_server():
    """清理服务器进程"""
    global uvicorn_server, server_thread, server_should_stop
    
    print("正在关闭服务器...")
    server_should_stop = True
    
    # 尝试优雅关闭uvicorn服务器
    if uvicorn_server:
        try:
            uvicorn_server.should_exit = True
            print("服务器已设置关闭标志")
        except Exception as e:
            print(f"优雅关闭服务器失败: {e}")
    
    # 强制终止占用8000端口的进程
    try:
        import subprocess
        # 查找占用8000端口的进程
        result = subprocess.run(['netstat', '-ano', '-p', 'tcp'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            line = line.strip()
            if ':8000' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    try:
                        subprocess.run(['taskkill', '/F', '/PID', pid, '/T'], 
                                     capture_output=True, check=True)
                        print(f"已终止占用8000端口的进程 PID: {pid}")
                    except Exception as e:
                        print(f"终止进程 PID: {pid} 失败: {e}")
    except Exception as e:
        print(f"查找占用8000端口的进程失败: {e}")

def signal_handler(signum, frame):
    """信号处理器"""
    print(f"\n收到信号 {signum}，正在关闭服务...")
    cleanup_server()
    sys.exit(0)

def main():
    """主函数"""
    global uvicorn_server, server_thread, server_should_stop
    
    print("="*50)
    print("投标服务大师 - 加密版启动中...")
    print("="*50)
    # print("注意: 此版本使用PyArmor加密保护")
    print("="*50)
    
    # 注册信号处理器
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, signal_handler)
    if hasattr(signal, 'SIGINT'):
        signal.signal(signal.SIGINT, signal_handler)
    
    # 注册退出处理器
    atexit.register(cleanup_server)
    
    try:
        print("OK: 切换到加密后端目录")
        print("启动服务器...")
        
        def start_server():
            global uvicorn_server, server_should_stop
            try:
                import uvicorn
                # 动态导入app.main模块
                try:
                    from app.main import app
                except ImportError as ie:
                    print(f"ERROR: 无法导入app.main: {ie}")
                    print(f"当前工作目录: {os.getcwd()}")
                    print(f"Python路径: {sys.path[:3]}")
                    raise ie
                
                # 创建uvicorn配置
                config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
                uvicorn_server = uvicorn.Server(config)
                
                # 运行服务器
                uvicorn_server.run()
                
            except Exception as e:
                if not server_should_stop:
                    print(f"ERROR: 服务启动失败: {e}")
                    import traceback
                    traceback.print_exc()
                    # 处理打包环境下的stdin问题
                    try:
                        input("按回车键退出...")
                    except RuntimeError:
                        # 当stdin不可用时，直接退出
                        sys.exit(1)
        
        # 创建非守护线程，但添加退出处理
        server_thread = threading.Thread(target=start_server, daemon=False)
        server_thread.start()
        
        print("等待服务启动...")
        time.sleep(5)
        
        def open_browser():
            if not server_should_stop:
                time.sleep(2)
                try:
                    webbrowser.open('http://localhost:8000')
                    print("浏览器已打开")
                except Exception as e:
                    print(f"打开浏览器失败: {e}")
        
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        print("\n" + "="*50)
        print("加密版服务启动完成！")
        print("访问地址: http://localhost:8000")
        print("API文档: http://localhost:8000/docs")
        print("健康检查: http://localhost:8000/health")
        print("="*50)
        # print("\n完整功能已集成，Python代码已加密保护")
        print("关闭此窗口会自动停止服务")
        print("按 Ctrl+C 可以安全退出")
        print("="*50)
        
        # 等待服务器线程，或者直到收到退出信号
        try:
            while server_thread.is_alive() and not server_should_stop:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n收到退出信号...")
            
    except KeyboardInterrupt:
        print("\n服务已关闭")
    except Exception as e:
        print(f"运行时错误: {e}")
        import traceback
        traceback.print_exc()
        # 即使在打包环境中也尝试显示错误
        input("按回车键退出...")
    finally:
        cleanup_server()
        print("程序已退出")

if __name__ == "__main__":
    main()


    