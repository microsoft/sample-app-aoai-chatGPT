#!/usr/bin/env python3
import json
from dotenv import dotenv_values

# Lädt die Werte aus der .env-Datei (im aktuellen Verzeichnis)
env_vars = dotenv_values(".env")

# Gib für jede Variable eine export-Anweisung aus,
# wobei json.dumps() den String sicher in Anführungszeichen einschließt
for key, value in env_vars.items():
    # value kann auch None sein – hier als leerer String ersetzen
    if value is None:
        value = ""
    print(f'export {key}={json.dumps(value)}')
