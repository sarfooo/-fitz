import os

import requests


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


cookies = {
    "feature_user_id": require_env("GRAILED_FEATURE_USER_ID"),
    "__stripe_mid": require_env("GRAILED_STRIPE_MID"),
    "g_state": require_env("GRAILED_G_STATE"),
    "grailed_jwt": require_env("GRAILED_JWT"),
    "cf_clearance": require_env("GRAILED_CF_CLEARANCE"),
    "__cf_bm": require_env("GRAILED_CF_BM"),
    "__stripe_sid": require_env("GRAILED_STRIPE_SID"),
    "csrf_token": require_env("GRAILED_CSRF_TOKEN"),
    "_grailed_session": require_env("GRAILED_SESSION"),
}

headers = {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9",
    "accept-version": "v1",
    "content-type": "application/json",
    "device-id": require_env("GRAILED_DEVICE_ID"),
    "origin": "https://www.grailed.com",
    "priority": "u=1, i",
    "referer": "https://www.grailed.com/shop?query=y2k+shirt&sort=most-relevant",
    "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "x-csrf-token": require_env("GRAILED_CSRF_TOKEN"),
}

response = requests.post(
    "https://www.grailed.com/api/algolia/keys",
    cookies=cookies,
    headers=headers,
)
print(response.text)
