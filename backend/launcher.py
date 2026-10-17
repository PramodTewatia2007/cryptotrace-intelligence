import sys
import os
import time
import webbrowser
import threading

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def open_browser():
    time.sleep(1.8)
    print("\n[+] Opening CryptoTrace Intelligence Web Console: http://127.0.0.1:8000\n")
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception as e:
        print(f"[-] Could not automatically launch browser: {e}")

def main():
    print("=" * 75)
    print("                 CRYPTOTRACE INTELLIGENCE SYSTEM")
    print("    Real-Time Crypto Fraud Attribution Console for Law Enforcement")
    print("=" * 75)
    print("\n[*] Initializing forensic engine and loading multi-chain adapters...")
    print("[*] Serving Web Application & REST API on http://127.0.0.1:8000")
    print("[*] OpenAPI Documentation available at http://127.0.0.1:8000/docs")
    print("[*] Press Ctrl+C in this console window to shut down the server.\n")

    # Start browser auto-launch thread
    threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    from app.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    main()
