import time
import subprocess
import sys

print("🤖 Buscador automático de recordatorios iniciado (revisando cada 60 segundos)...")
print("Presiona Ctrl + C para detenerlo en cualquier momento.\n")

try:
    while True:
        subprocess.run([sys.executable, "manage.py", "send_reminders"])
        time.sleep(60)
except KeyboardInterrupt:
    print("\n🛑 Proceso de recordatorios detenido correctamente.")
