# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import urllib.request, re, json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Encoding': 'identity',
}

url = 'https://aqarmap.com.eg/en/listing/7237783-for-sale-cairo-new-cairo-90th-street-southern-90th-st/'
req = urllib.request.Request(url, headers=HEADERS)
with urllib.request.urlopen(req, timeout=20) as r:
    html = r.read().decode('utf-8', errors='replace')

print(f"HTML length: {len(html)}")

# Find ALL image URLs
all_imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)', html)
print(f"\nAll image URLs ({len(all_imgs)}):")
seen = set()
for img in all_imgs:
    if img not in seen:
        seen.add(img)
        print(f"  {img}")

# Check what domains are used
domains = set()
for img in all_imgs:
    m = re.match(r'https?://([^/]+)', img)
    if m:
        domains.add(m.group(1))
print(f"\nImage domains: {domains}")

# Find price
prices = re.findall(r'"price"\s*:\s*"?([\d,\.]+)"?', html)
print(f"\nPrice values: {prices[:5]}")

# Find title
m = re.search(r'<title>([^<]+)</title>', html)
if m: print(f"Title: {m.group(1)}")

# Find any JSON with image arrays
json_imgs = re.findall(r'"(?:image|photo|img|src|url)"\s*:\s*"(https?://[^"]+)"', html)
print(f"\nJSON image refs ({len(json_imgs)}):")
for j in set(json_imgs[:10]):
    print(f"  {j}")
