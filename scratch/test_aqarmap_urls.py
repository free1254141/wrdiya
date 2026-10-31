import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

test_urls = [
    'https://aqarmap.com.eg/ar/search?searchQuery=%D8%A8%D8%A7%D8%AF%D9%8A%D8%A9',
    'https://aqarmap.com.eg/ar/for-sale/property-type/?searchQuery=%D8%A8%D8%A7%D8%AF%D9%8A%D8%A9',
    'https://aqarmap.com.eg/ar/for-sale/property/all/egypt/?searchQuery=%D8%A8%D8%A7%D8%AF%D9%8A%D8%A9',
    'https://aqarmap.com.eg/ar/compounds/?searchQuery=%D8%A8%D8%A7%D8%AF%D9%8A%D8%A9',
    'https://aqarmap.com.eg/ar/compounds/badya',
    'https://aqarmap.com.eg/ar/compounds/badya-palm-hills',
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for u in test_urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(u[:60], '=>', resp.status, resp.geturl()[:60])
    except Exception as e:
        print(u[:60], '=> ERROR:', e)
