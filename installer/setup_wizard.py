import tkinter as tk
from tkinter import messagebox, simpledialog
import os
import subprocess
import sys
import venv
from pathlib import Path

def create_venv_and_install():
    project_root = Path(__file__).parent.parent
    venv_path = project_root / "backend" / "venv"
    
    if not venv_path.exists():
        print("Creating virtual environment...")
        venv.create(venv_path, with_pip=True)
    
    pip_path = venv_path / "Scripts" / "pip.exe"
    subprocess.check_call([str(pip_path), "install", "-r", str(project_root / "backend" / "requirements.txt")])
    
    # Build React frontend
    frontend_dir = project_root / "frontend"
    subprocess.check_call(["npm", "install"], cwd=frontend_dir)
    subprocess.check_call(["npm", "run", "build"], cwd=frontend_dir)
    
    messagebox.showinfo("Success", "Granite Tasty Skeleton installed!\n\nRun: backend\\venv\\Scripts\\python backend\\main.py")

def main():
    root = tk.Tk()
    root.withdraw()
    
    client_secret = simpledialog.askstring("OAuth Setup", "Enter your Tastytrade Client Secret:", show='*')
    refresh_token = simpledialog.askstring("OAuth Setup", "Enter your Tastytrade Refresh Token:", show='*')
    sandbox = messagebox.askyesno("Environment", "Use Sandbox? (recommended for testing)")
    
    if not client_secret or not refresh_token:
        messagebox.showerror("Error", "Both secret and refresh token are required!")
        sys.exit(1)
    
    env_path = Path(__file__).parent.parent / "backend" / ".env"
    env_content = f"""TASTY_CLIENT_SECRET={client_secret}
TASTY_REFRESH_TOKEN={refresh_token}
TASTY_SANDBOX={"true" if sandbox else "false"}
"""
    env_path.write_text(env_content)
    
    messagebox.showinfo("Credentials Saved", ".env created successfully!")
    create_venv_and_install()

if __name__ == "__main__":
    main()