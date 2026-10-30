# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import urllib.request, re, json

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
url = 'https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/'
req = urllib.request.Request(url, headers=HEADERS)
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode('utf-8', errors='replace')
        print(f'Status: OK, html_length={len(html)}')

        # Find listing URLs
        p1 = re.compile(r'href="(https://aqarmap\.com\.eg/en/listing/\d+[^"]*)"')
        p2 = re.compile(r'href="(/en/listing/\d+[^"]*)"')
        urls1 = p1.findall(html)
        urls2 = p2.findall(html)
        print(f'Direct listing URLs found: {len(urls1)}')
        print(f'Relative listing URLs found: {len(urls2)}')
        for u in (urls1+urls2)[:5]:
            print(f'  {u}')

        # Check JSON-LD
        jld = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)
        blocks = jld.findall(html)
        print(f'JSON-LD blocks: {len(blocks)}')
        for b in blocks[:2]:
            try:
                d = json.loads(b[:500])
                print(f'  @type: {d.get("@type","")} | keys: {list(d.keys())[:6]}')
            except: pass

        # Check NEXT_DATA
        nd = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)
        m = nd.search(html)
        if m:
            try:
                d = json.loads(m.group(1))
                txt = json.dumps(d)
                listing_ids = re.findall(r'/en/listing/(\d+)', txt)
                print(f'NEXT_DATA listing IDs: {len(set(listing_ids))}')
                for lid in list(set(listing_ids))[:8]:
                    print(f'  /en/listing/{lid}')
            except Exception as ex:
                print(f'NEXT_DATA parse error: {ex}')
        else:
            print('No __NEXT_DATA__ found')

        # Check for API calls in HTML
        api_calls = re.findall(r'https://aqarmap\.com\.eg/api/[^\s"\'<>]+', html)
        print(f'API URLs in HTML: {len(api_calls)}')
        for a in api_calls[:5]:
            print(f'  {a}')

        # Try to find any JSON with listing data
        listing_p = re.compile(r'"listingId"\s*:\s*(\d+)')
        listing_ids2 = listing_p.findall(html)
        print(f'listingId occurrences: {len(listing_ids2)}')
        for lid in list(set(listing_ids2))[:5]:
            print(f'  listingId: {lid}')

except Exception as e:
    print(f'ERROR: {e}')
