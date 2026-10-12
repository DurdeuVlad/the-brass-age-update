import socket
import struct
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

HOST, PORT, PW = '127.0.0.1', 12199, 'zKamper_|_'

def packet(rid, ptype, payload):
    body = struct.pack('<ii', rid, ptype) + payload.encode('utf-8') + b'\x00\x00'
    return struct.pack('<i', len(body)) + body

def recv_packet(s):
    raw = s.recv(4)
    if not raw or len(raw) < 4:
        return None, None, b""
    (ln,) = struct.unpack('<i', raw)
    data = b""
    while len(data) < ln:
        chunk = s.recv(ln - len(data))
        if not chunk:
            break
        data += chunk
    rid, ptype = struct.unpack('<ii', data[:8])
    payload = data[8:-2]
    return rid, ptype, payload

def run_command(cmd):
    s = socket.create_connection((HOST, PORT), timeout=10)
    s.sendall(packet(1, 3, PW))
    recv_packet(s)
    s.sendall(packet(2, 2, cmd))
    _, _, payload = recv_packet(s)
    s.close()
    return payload.decode('utf-8', errors='replace')

if __name__ == '__main__':
    cmds = sys.argv[1:] if len(sys.argv) > 1 else [
        'help',
        'summon item 0 100 0 {Item:{id:"kubejs:coal_rod",count:1}}',
        'straja test falsuri'
    ]
    for c in cmds:
        print(f">>> {c}")
        res = run_command(c)
        print(res.strip())
        print("-" * 50)
