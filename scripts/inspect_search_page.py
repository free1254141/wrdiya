import urllib.request, re, http.cookiejar, json

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36'),
    ('Accept-Language', 'ar,en;q=0.9')
]

url = 'https://aqarmap.com.eg/ar/for-sale/property-type/cairo/new-cairo/'
resp = opener.open(url, timeout=12)
html = resp.read().decode('utf-8', errors='ignore')

scripts = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL)
print('JSON-LD scripts found on search page:', len(scripts))
for i, s in enumerate(scripts):
    try:
        d = json.loads(s)
        if isinstance(d, dict) and '@graph' in d:
            print(f"Script {i} graph length: {len(d['@graph'])}")
            for node in d['@graph']:
                print("  Node type:", node.get('@type'), "| name:", node.get('name'))
                if node.get('@type') == 'ItemList':
                    print("  ItemList elements:", len(node.get('itemListElement', [])))
                    if node.get('itemListElement'):
                        first = node['itemListElement'][0]
                        print("  Sample item:", json.dumps(first, ensure_ascii=False))
    except Exception as e:
        print("Error:", e)
