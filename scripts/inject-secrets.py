#!/usr/bin/env python3
import os
import sys

def main():
    bin_id = os.environ.get('JSONBIN_ID', '').strip()
    bin_key = os.environ.get('JSONBIN_API_KEY', '').strip()

    path = os.path.join(os.getcwd(), 'game.js').replace('\\', '/')
    if not os.path.exists(path):
        print(f"[inject-secrets] game.js not found at {path}")
        return 0

    with open(path, 'r', encoding='utf-8') as f:
        data = f.read()

    if bin_id:
        data = data.replace("const JSONBIN_ID = 'YOUR_BIN_ID_HERE';", f"const JSONBIN_ID = '{bin_id}';")
    if bin_key:
        data = data.replace("const JSONBIN_API_KEY = '$2a$10$YOUR_API_KEY_HERE';", f"const JSONBIN_API_KEY = '{bin_key}';")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(data)

    print("[inject-secrets] Secrets injected into game.js")
    return 0

if __name__ == '__main__':
    sys.exit(main())
