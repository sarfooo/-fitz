import tls_client

session = tls_client.Session(

    client_identifier="chrome112",

    random_tls_extension_order=True

)

cookies = {
    '__cf_bm': '__cf_bm=XuRY5YCaINYTEdCpt2s1jkWKkigtL6yMvaDS2I4DUc8-1776474967.103239-1.0.1.1-seMLrJhEA5cv4OLgJZfhWEyg4UqeJ._tjHPuCPMLhoZ4FJiS7ruV8uCgsTPIwjacZ0q.57NZBl.UuLsFXyNaS9Nr8GeHKCG8e7Xl6RANtafLdReoyqVa9Msw2zT_WCYSM5dEjVImcbupcWEEt0EW2Q',
}

headers = {
    'accept': 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'accept-version': 'v1',
    # 'content-length': '0',
    'content-type': 'application/json',
    'device-id': '58a435bd-38d4-4dab-8816-87f18cddbbf6',
    'origin': 'https://www.grailed.com',
    'priority': 'u=1, i',
    'referer': 'https://www.grailed.com/shop?query=y2k%20shirt',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    # 'cookie': '__cf_bm=kB2NgBUXaSJUyfz2I8P8AtZFcpR7yTL8n.M37EOS0Fg-1776474866.433228-1.0.1.1-j91DONzJL9H_ieczd_nutb_ZLJ53Fi9fcfhn4kQwohGdiE5eowBgWd9BxXLMvtccfQUWHWsVmCSIbEkdMzfQcYAHtnznw3kUOqhru_riu3zIYFKhzqR09d..Y6Fm9jPkGvB3Q.8KJ.GZKnvsjQ7qpw',
}

response = session.post('https://www.grailed.com/api/algolia/keys', cookies=cookies, headers=headers)
print(response.text)