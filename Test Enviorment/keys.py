import requests

cookies = {
    'feature_user_id': 'a378837d-4b4b-41d0-aff7-36161dc30530',
    '__stripe_mid': '8a4f32f7-293c-46ea-973b-7d3d110a15052f159e',
    'g_state': '{"i_l":0,"i_ll":1776407305659,"i_e":{"enable_itp_optimization":19},"i_et":1776407300016,"i_b":"kZ5IxMRavHvGonSTyOM4V6KTNYqgpKZsJNhOkhr+eOQ"}',
    'grailed_jwt': 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjE4NjU2NTU5LCJqdGkiOiI0N2JkZDBkNS0yMTQ1LTQzY2ItOWU1MC01Y2MzNDBjZjJlMzciLCJpc3MiOiJHcmFpbGVkLXByb2R1Y3Rpb24iLCJhY3QiOiJhdXRoIiwiaWF0IjoxNzc2NDA3MzA1fQ.NKvuKk9E1xc5H4HloxMz6abk2xJj2xZAzJpi38eGoRw',
    'cf_clearance': 'CPYkUpVcN.2HvmVbuaokGW2TOMzAW7MC7Q3p1dEDXEg-1776473254-1.2.1.1-XB38oRnOT9Zs3aFPnr.s8Swi1mERHWyBxdLO7Vyaqr0PdCM_BlKPS2ePEgLI1hESo5OvAhaKNGTVJ1ByRL.efmW3F_rugijAVWIEWvQoH6v_2cgVdYgTfOrBdqr_DR5Nsulxc2jscX7ZsiZ_HUv9PK1gv6IyvqDN8k3usgnFfEbYp0AvMGfwLj7Jvqd7CjnXDEM3zKgek5T1oiRCs7r8F_cLVFETh1NkRMVYulb2ofQQfAOi188MuYYskqIYRZYO707Y0pODjMBiQELjBLFALCNclmBuRqnwo4Zu33yddmmkRGr_81F2BD6uPOW6rm2QaMiFQZji5.P2s3FViuu1Ow',
    '__cf_bm': 'W4X6.eDivOdecO9fbLH1uWfjoK0E2qTnRp8GXC5ZTFg-1776473254.1078684-1.0.1.1-QsACej7RumwAmqvBzn4nBYr6roUGylgEiy5DdC7xgUYY58b7wxrHZE1FKLXbq9JIvyyAIHo4xgev8VW0JAL3tQRgocCHyuMjiaqtZ0s7oG8FGGNXFzaMdhSvC0_dKyaqzmFscM7uvyJ.Bt._LAWdQQ',
    '__stripe_sid': 'be9ae2aa-ceb5-4dee-8b98-6a80ab421381329482',
    'csrf_token': 'GbO4HmqKe_G2kpCzVjLJNoFsEPJycp89CuO1oyb_hFwrcoyrbX-RjVDSWcLS0oym2089yxWcP8DtOovxshj7Vg',
    '_grailed_session': 'dbkweTkpfNaMQGQRmmQA306mkCaxqiWjXJGAAGlEQerHyZ4RYDUMtf%2FHU7Zv5EGhzeFf8OesW3UdSqaNNlcIw%2BO7M%2BG8w9LTBv8R4MIUMrkFcDoBcWEKmZkxpb%2Ft7Z0JZtPkq1IH6X8vie01eVBszVWvIQ3jg9PnHBUcybvsZPZ2FVniyeSXFluKUMXtdVCD50EVEoBjuEV6pv%2Blt68DmbQVquYQrFm%2BQvCjrfqy2QMl4KvLsR9qGpmhLXK3rCHX6PJGiv1vhuF%2F1cPYUVi0BKkI9CbLi6VP0e57wDVhvkg0IRbwLAuBsotVZXaFsA%3D%3D--tMzpZcNt28BgA%2BAo--eqR1Hp0zbXjPDkdyTaLGMA%3D%3D',
}

headers = {
    'accept': 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'accept-version': 'v1',
    # 'content-length': '0',
    'content-type': 'application/json',
    'device-id': '77114551-3ed9-4cfa-a0b5-cfa5222807fd',
    'origin': 'https://www.grailed.com',
    'priority': 'u=1, i',
    'referer': 'https://www.grailed.com/shop?query=y2k+shirt&sort=most-relevant',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    'x-csrf-token': 'GbO4HmqKe_G2kpCzVjLJNoFsEPJycp89CuO1oyb_hFwrcoyrbX-RjVDSWcLS0oym2089yxWcP8DtOovxshj7Vg',
    # 'cookie': 'feature_user_id=a378837d-4b4b-41d0-aff7-36161dc30530; __stripe_mid=8a4f32f7-293c-46ea-973b-7d3d110a15052f159e; g_state={"i_l":0,"i_ll":1776407305659,"i_e":{"enable_itp_optimization":19},"i_et":1776407300016,"i_b":"kZ5IxMRavHvGonSTyOM4V6KTNYqgpKZsJNhOkhr+eOQ"}; grailed_jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjE4NjU2NTU5LCJqdGkiOiI0N2JkZDBkNS0yMTQ1LTQzY2ItOWU1MC01Y2MzNDBjZjJlMzciLCJpc3MiOiJHcmFpbGVkLXByb2R1Y3Rpb24iLCJhY3QiOiJhdXRoIiwiaWF0IjoxNzc2NDA3MzA1fQ.NKvuKk9E1xc5H4HloxMz6abk2xJj2xZAzJpi38eGoRw; cf_clearance=CPYkUpVcN.2HvmVbuaokGW2TOMzAW7MC7Q3p1dEDXEg-1776473254-1.2.1.1-XB38oRnOT9Zs3aFPnr.s8Swi1mERHWyBxdLO7Vyaqr0PdCM_BlKPS2ePEgLI1hESo5OvAhaKNGTVJ1ByRL.efmW3F_rugijAVWIEWvQoH6v_2cgVdYgTfOrBdqr_DR5Nsulxc2jscX7ZsiZ_HUv9PK1gv6IyvqDN8k3usgnFfEbYp0AvMGfwLj7Jvqd7CjnXDEM3zKgek5T1oiRCs7r8F_cLVFETh1NkRMVYulb2ofQQfAOi188MuYYskqIYRZYO707Y0pODjMBiQELjBLFALCNclmBuRqnwo4Zu33yddmmkRGr_81F2BD6uPOW6rm2QaMiFQZji5.P2s3FViuu1Ow; __cf_bm=W4X6.eDivOdecO9fbLH1uWfjoK0E2qTnRp8GXC5ZTFg-1776473254.1078684-1.0.1.1-QsACej7RumwAmqvBzn4nBYr6roUGylgEiy5DdC7xgUYY58b7wxrHZE1FKLXbq9JIvyyAIHo4xgev8VW0JAL3tQRgocCHyuMjiaqtZ0s7oG8FGGNXFzaMdhSvC0_dKyaqzmFscM7uvyJ.Bt._LAWdQQ; __stripe_sid=be9ae2aa-ceb5-4dee-8b98-6a80ab421381329482; csrf_token=GbO4HmqKe_G2kpCzVjLJNoFsEPJycp89CuO1oyb_hFwrcoyrbX-RjVDSWcLS0oym2089yxWcP8DtOovxshj7Vg; _grailed_session=dbkweTkpfNaMQGQRmmQA306mkCaxqiWjXJGAAGlEQerHyZ4RYDUMtf%2FHU7Zv5EGhzeFf8OesW3UdSqaNNlcIw%2BO7M%2BG8w9LTBv8R4MIUMrkFcDoBcWEKmZkxpb%2Ft7Z0JZtPkq1IH6X8vie01eVBszVWvIQ3jg9PnHBUcybvsZPZ2FVniyeSXFluKUMXtdVCD50EVEoBjuEV6pv%2Blt68DmbQVquYQrFm%2BQvCjrfqy2QMl4KvLsR9qGpmhLXK3rCHX6PJGiv1vhuF%2F1cPYUVi0BKkI9CbLi6VP0e57wDVhvkg0IRbwLAuBsotVZXaFsA%3D%3D--tMzpZcNt28BgA%2BAo--eqR1Hp0zbXjPDkdyTaLGMA%3D%3D',
}

response = requests.post('https://www.grailed.com/api/algolia/keys', cookies=cookies, headers=headers)
print(response.text)