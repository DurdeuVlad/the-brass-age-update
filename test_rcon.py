import socket
import struct
import sys

HOST, PORT, PW = '127.0.0.1', 12005, 'zKamper_|_'

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

try:
    s = socket.create_connection((HOST, PORT), timeout=15)
    print("Connected to RCON")
    s.sendall(packet(1, 3, PW))
    rid, ptype, payload = recv_packet(s)
    print(f"Auth response: rid={rid}, ptype={ptype}, payload={payload}")
    if rid == 1:
        print("Auth success! Sending command...")
        cmd = "help" if len(sys.argv) < 2 else sys.argv[1]
        s.sendall(packet(2, 2, cmd))
        rid, ptype, payload = recv_packet(s)
        print(f"Cmd response: rid={rid}, ptype={ptype}, payload={payload.decode('utf-8', errors='replace')}")
    s.close()
except Exception as e:
    print(f"Error: {e}")
