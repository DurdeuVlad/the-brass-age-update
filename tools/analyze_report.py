import json, glob, os

reports = sorted(glob.glob('E:/Github2/rusticcraft2-clona/test-silver-instance/heaphammer/reports/*.json'))
if not reports:
    print("No reports found.")
    exit(0)

latest = reports[-1]
print(f"Reading latest report: {os.path.basename(latest)}\n")

with open(latest, 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=== EXPERIMENT SPEC ===')
print(json.dumps(data.get('spec', {}), indent=2))

print('\n=== CHECKPOINTS ===')
for cp in data.get('checkpoints', []):
    m = cp.get('metrics', {})
    h_mb = m.get('heapUsedBytes', 0) / (1024 * 1024)
    c_mb = m.get('heapCommittedBytes', 0) / (1024 * 1024)
    phase = cp.get('phase', '')
    iteration = cp.get('iteration', 0)
    chunks = m.get('loadedChunks', 0)
    ent = m.get('activeEntities', 0)
    gc = m.get('gcCount', 0)
    gctime = m.get('gcTimeMs', 0)
    print(f"[{phase:<18} cyc {iteration:>2}] Heap: {h_mb:7.1f}MB / {c_mb:7.1f}MB | Chunks: {chunks:>4} | Ent: {ent:>4} | GC: {gc:>3} ({gctime}ms)")

print('\n=== DETECTION ===')
print(json.dumps(data.get('detection', {}), indent=2))
