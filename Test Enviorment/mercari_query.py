import requests

cookies = {
    'TAsessionID': 'bf082375-0661-4e59-829c-0e6aed4ba9ab|NEW',
    'notice_behavior': 'implied,eu',
    'usprivacy': '1---',
    '_gcl_au': '1.1.981319022.1776493476',
    '_mwus': 'eyJhY2Nlc3NUb2tlbiI6ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUppSWpvaVpURm1NMkk1WmpVNU56VmlOak01T0RRMU0yTTFZekE1WldFd09XRXpNaklpTENKa1lYUmhJanA3SW5WMWFXUWlPaUpuYURwM09qSTRNekExTVRnd0xUYzNPV0V0TkRrME1DMWlaakJpTFRNeU1XTmtNVEpqT1dVNVppSXNJbUZqWTJWemMxUnZhMlZ1SWpvaVdscElXV2RHWjBSUmFtcEFNM0EwVEZkb1FGRldUV0V5WmlGWk9FMDJVRmc0TGxwcWFuWlFVR00zYlV4cVVFNUdURjlYUzNOb0luMHNJbVY0Y0NJNk1UYzNOekE1T0RJM05pd2lhV0YwSWpveE56YzJORGt6TkRjMmZRLmkySUtVcXVPUkEyczIzTDdfV1RYTlp0VE9aRnJ1ZkRmV1lKZ2cwbHl3R3ciLCJyZWZyZXNoVG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaUlqb2laVEZtTTJJNVpqVTVOelZpTmpNNU9EUTFNMk0xWXpBNVpXRXdPV0V6TWpJaUxDSmtZWFJoSWpwN0luVjFhV1FpT2lKbmFEcDNPakk0TXpBMU1UZ3dMVGMzT1dFdE5EazBNQzFpWmpCaUxUTXlNV05rTVRKak9XVTVaaUo5TENKcFlYUWlPakUzTnpZME9UTTBOelo5Lm52SDFyWEJ3SnZLcjc0MWU4MHZTU0g0dWZuX2hTMFAzSWdQa3hGVS1kVUEiLCJjc3JmU2VjcmV0IjoiMklyeDJDZzBRYUkwZnNsLVI2bDRFdndyIn0=',
    '_mwus.sig': 'YjPMEye1x8zj09z_jlbmRbhxrcU',
    'cf_clearance': '8nZ54z.sz.vOmLnJKatLBRJAfgk9Wvokpptox3QL4kk-1776493476-1.2.1.1-t3lcxQjKDXElcPM4p2E42Wq9dIjAEa5Lpux4FP0ejdDia17fPvfvUk_u.mUR0Ks_6EB4ZgnJhs.kdr2tlLBMJ8kftJZEmPrG61FZITLC.tdKgv3mGpb.bIR43_bK0ut_nM_9bsDf9j2mKKiUpmX34ZN9CzphTXzDiuQBHVME9.jda_GRoREVRZGGQAUWWQVIxFzR4T5lWbUQ.0gdOOEwrjBqnhIJMVG9eFZslm.wVKufgRT8PvXJr7lak6mOdLeqEIytUj2B4zxm.yKgFblrIRmRsRPEVPok6nDnoxm2QQb_iw9evyttde5ydxG7Rct4idxlZ7FsqTpH.oGMcnFqdg',
    '__cf_bm': '23PHOaqkgNgyP1KBycx256pKj0bgPETqAjm1F4iz03I-1776493476.596461-1.0.1.1-xLuys.IvSKPwVR_Xr8c.WGwrSY4XZSTDm.5opd.zJb4ePXmgh9HzkI1wWlMQvgFSU3_xVOAV0uS6klJzP583crnHGV_oOGbWphRiUSmMRsNJdyCQBoyOMSvAudyCFgLk',
    '_ga': 'GA1.1.1939381947.1776493477',
    'ab.storage.userId.10e16a16-356e-4541-bbc2-4440b8ba6c7a': 'g%3Anull%7Ce%3Aundefined%7Cc%3A1776493476902%7Cl%3A1776493476903',
    'ab.storage.deviceId.10e16a16-356e-4541-bbc2-4440b8ba6c7a': 'g%3A403d15e0-9e96-bbf3-d88f-2e95d2481eb1%7Ce%3Aundefined%7Cc%3A1776493476904%7Cl%3A1776493476904',
    'ab.storage.sessionId.10e16a16-356e-4541-bbc2-4440b8ba6c7a': 'g%3Adec3c70a-3543-ddc1-3926-3434a982efcc%7Ce%3A1776495276905%7Cc%3A1776493476903%7Cl%3A1776493476905',
    '_fbp': 'fb.1.1776493476946.714244896769070155',
    '_s_did': 'eyJraWQiOiJmMzRiN2YiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJlNTVjMzdhZC1lMDgyLTRmMmUtOTA4NS1lYWRkZDVmZDMwOWUifQ.FYQDLEriVF55yREpVGEjUfTHmVhOnBxN2iQwQfOWTFZWq8UWDnGb-wIpjRS3n-8kiinAU_cIieX8RtjEEPfqpQ',
    '_cfuvid': '27rlGkgonwR8qmC0SpF_41Y7orsUAh7voA8CVCQu8zc-1776493476.740313-1.0.1.1-T8P1qcm3J.ja2vv4xqSW37AUEcvttgR4R.9jW92vfjs',
    '_ga_DJ5N7E6D07': 'GS2.1.s1776493476$o1$g1$t1776493477$j59$l0$h0$dkyW0WcF955xn0Hdc_MnuOGTOX7NmAcK-Hg',
    'notice_preferences': '2:',
    'notice_gdpr_prefs': '0,1,2:',
    'notice_poptime': '1620235800000',
    'cmapi_gtm_bl': '',
    'cmapi_cookie_privacy': 'permit 1,2,3',
    '_uetsid': '45f047403aef11f19a67b930a43ee939',
    '_uetvid': '45f041d03aef11f189afdff96d22657a',
    'g_state': '{"i_l":0,"i_ll":1776493506849,"i_b":"lNP/0I2tmKvi1rKCpOrXZFD4riiioLEh2t7imBfJ14A","i_e":{"enable_itp_optimization":20},"i_et":1776493477227}',
}

headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'apollo-require-preflight': 'true',
    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiIjoiZTFmM2I5ZjU5NzViNjM5ODQ1M2M1YzA5ZWEwOWEzMjIiLCJkYXRhIjp7InV1aWQiOiJnaDp3OjI4MzA1MTgwLTc3OWEtNDk0MC1iZjBiLTMyMWNkMTJjOWU5ZiIsImFjY2Vzc1Rva2VuIjoiWlpIWWdGZ0RRampAM3A0TFdoQFFWTWEyZiFZOE02UFg4LlpqanZQUGM3bUxqUE5GTF9XS3NoIn0sImV4cCI6MTc3NzA5ODI3NiwiaWF0IjoxNzc2NDkzNDc2fQ.i2IKUquORA2s23L7_WTXNZtTOZFrufDfWYJgg0lywGw',
    'baggage': 'sentry-environment=production,sentry-release=double-web%40r-v1.26.1577,sentry-public_key=3bd64a49e0a144ec9b59a0dc0ff54f18,sentry-trace_id=f1e9df05c270481ca70b52b841b24652,sentry-org_id=66889,sentry-transaction=%2Fsearch%2F,sentry-sampled=false,sentry-sample_rand=0.4286302618432657,sentry-sample_rate=0.02',
    'content-type': 'application/json',
    'mercari-client-request-id': '2e341780-8bb3-458d-8174-6bb437c9dc02',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sentry-trace': 'f1e9df05c270481ca70b52b841b24652-b3a77edeba1561c7-0',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    'x-app-version': '1',
    'x-csrf-token': '1s6SsDCb-JEZwjmcSiD9wgisx7EcVAtkwcnE',
    'x-double-web': '1',
    'x-ld-variants': 'show-serp-xb-label:0;experiment-serp-xb-itemshipfee-app:2;experiment-search-stop-token-filter:2;experiment-search-newest-sort-seller-blocklist:2;experiment-search-query-rules-boost-parameter:2;cross-border-search-item-ratio:1;cross-border-search-item-ratio-for-newest:1;experiment-search-seller-score-boost:2;experiment-search-score-decay-by-listing-age:2;experiment-checkout-show-discount:2;show-venmo-payments:2;experiment-search-saved-search-seller-blocklist:2;experiment-show-sold-items-on-promote:1;experiment-show-sold-items-on-listing:1;show-auth-option-facebook:1;show-auth-option-google:1;show-auth-option-apple:1;show-chat-warning-impersonation-banner:1;show-cross-border-tariffs-web-ui:2;referral-config-version:2;experiment-2col-3col-toggle-update:0;experiment-black-cta:0;experiment-campaign-boost-banner:0;config-campaign-boost-banner-index:1;migration-eaas:2;use-gcs-bucket-photo-upload-public:2;experiment-idp-revamp:0;experiment-pmax-idp-header-simplification:0;experiment-fingerprint-poc:0;experiment-idp-micro-cosmetic:2;experiment-idp-micro-balance:2;experiment-idp-micro-couponbundle:1;experiment-idp-micro-pricing:0;experiment-idp-pmax-similaritems-re:3;experiment-item-ai-enrichment-recall:2;experiment-for-you-long-term-mix:0;experiment-align-ss-sticky:2;experiment-serp-price-order-re:0;experiment-search-rerank-list-size:0;experiment-deals-only-search-user-preference-boosting:3',
    'x-platform': 'web',
    'x-socure-device-token': 'eyJraWQiOiJmMzRiN2YiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzd3QiOiIyYjI0NGQwNi0wMmQ3LTQ4OWQtODM1ZS03ZjdhYWM1ZDZiNzEifQ.Tu4v2gnqss4MXKObla9pCpfr2QMm97r-A4OgV1fMW0s9QjrO_OTL-b1qLIp88nO5gxqaiUf9o4vwMR5iWRMfBQ',
    # 'cookie': 'TAsessionID=bf082375-0661-4e59-829c-0e6aed4ba9ab|NEW; notice_behavior=implied,eu; usprivacy=1---; _gcl_au=1.1.981319022.1776493476; _mwus=eyJhY2Nlc3NUb2tlbiI6ImV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUppSWpvaVpURm1NMkk1WmpVNU56VmlOak01T0RRMU0yTTFZekE1WldFd09XRXpNaklpTENKa1lYUmhJanA3SW5WMWFXUWlPaUpuYURwM09qSTRNekExTVRnd0xUYzNPV0V0TkRrME1DMWlaakJpTFRNeU1XTmtNVEpqT1dVNVppSXNJbUZqWTJWemMxUnZhMlZ1SWpvaVdscElXV2RHWjBSUmFtcEFNM0EwVEZkb1FGRldUV0V5WmlGWk9FMDJVRmc0TGxwcWFuWlFVR00zYlV4cVVFNUdURjlYUzNOb0luMHNJbVY0Y0NJNk1UYzNOekE1T0RJM05pd2lhV0YwSWpveE56YzJORGt6TkRjMmZRLmkySUtVcXVPUkEyczIzTDdfV1RYTlp0VE9aRnJ1ZkRmV1lKZ2cwbHl3R3ciLCJyZWZyZXNoVG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaUlqb2laVEZtTTJJNVpqVTVOelZpTmpNNU9EUTFNMk0xWXpBNVpXRXdPV0V6TWpJaUxDSmtZWFJoSWpwN0luVjFhV1FpT2lKbmFEcDNPakk0TXpBMU1UZ3dMVGMzT1dFdE5EazBNQzFpWmpCaUxUTXlNV05rTVRKak9XVTVaaUo5TENKcFlYUWlPakUzTnpZME9UTTBOelo5Lm52SDFyWEJ3SnZLcjc0MWU4MHZTU0g0dWZuX2hTMFAzSWdQa3hGVS1kVUEiLCJjc3JmU2VjcmV0IjoiMklyeDJDZzBRYUkwZnNsLVI2bDRFdndyIn0=; _mwus.sig=YjPMEye1x8zj09z_jlbmRbhxrcU; cf_clearance=8nZ54z.sz.vOmLnJKatLBRJAfgk9Wvokpptox3QL4kk-1776493476-1.2.1.1-t3lcxQjKDXElcPM4p2E42Wq9dIjAEa5Lpux4FP0ejdDia17fPvfvUk_u.mUR0Ks_6EB4ZgnJhs.kdr2tlLBMJ8kftJZEmPrG61FZITLC.tdKgv3mGpb.bIR43_bK0ut_nM_9bsDf9j2mKKiUpmX34ZN9CzphTXzDiuQBHVME9.jda_GRoREVRZGGQAUWWQVIxFzR4T5lWbUQ.0gdOOEwrjBqnhIJMVG9eFZslm.wVKufgRT8PvXJr7lak6mOdLeqEIytUj2B4zxm.yKgFblrIRmRsRPEVPok6nDnoxm2QQb_iw9evyttde5ydxG7Rct4idxlZ7FsqTpH.oGMcnFqdg; __cf_bm=23PHOaqkgNgyP1KBycx256pKj0bgPETqAjm1F4iz03I-1776493476.596461-1.0.1.1-xLuys.IvSKPwVR_Xr8c.WGwrSY4XZSTDm.5opd.zJb4ePXmgh9HzkI1wWlMQvgFSU3_xVOAV0uS6klJzP583crnHGV_oOGbWphRiUSmMRsNJdyCQBoyOMSvAudyCFgLk; _ga=GA1.1.1939381947.1776493477; ab.storage.userId.10e16a16-356e-4541-bbc2-4440b8ba6c7a=g%3Anull%7Ce%3Aundefined%7Cc%3A1776493476902%7Cl%3A1776493476903; ab.storage.deviceId.10e16a16-356e-4541-bbc2-4440b8ba6c7a=g%3A403d15e0-9e96-bbf3-d88f-2e95d2481eb1%7Ce%3Aundefined%7Cc%3A1776493476904%7Cl%3A1776493476904; ab.storage.sessionId.10e16a16-356e-4541-bbc2-4440b8ba6c7a=g%3Adec3c70a-3543-ddc1-3926-3434a982efcc%7Ce%3A1776495276905%7Cc%3A1776493476903%7Cl%3A1776493476905; _fbp=fb.1.1776493476946.714244896769070155; _s_did=eyJraWQiOiJmMzRiN2YiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJlNTVjMzdhZC1lMDgyLTRmMmUtOTA4NS1lYWRkZDVmZDMwOWUifQ.FYQDLEriVF55yREpVGEjUfTHmVhOnBxN2iQwQfOWTFZWq8UWDnGb-wIpjRS3n-8kiinAU_cIieX8RtjEEPfqpQ; _cfuvid=27rlGkgonwR8qmC0SpF_41Y7orsUAh7voA8CVCQu8zc-1776493476.740313-1.0.1.1-T8P1qcm3J.ja2vv4xqSW37AUEcvttgR4R.9jW92vfjs; _ga_DJ5N7E6D07=GS2.1.s1776493476$o1$g1$t1776493477$j59$l0$h0$dkyW0WcF955xn0Hdc_MnuOGTOX7NmAcK-Hg; notice_preferences=2:; notice_gdpr_prefs=0,1,2:; notice_poptime=1620235800000; cmapi_gtm_bl=; cmapi_cookie_privacy=permit 1,2,3; _uetsid=45f047403aef11f19a67b930a43ee939; _uetvid=45f041d03aef11f189afdff96d22657a; g_state={"i_l":0,"i_ll":1776493506849,"i_b":"lNP/0I2tmKvi1rKCpOrXZFD4riiioLEh2t7imBfJ14A","i_e":{"enable_itp_optimization":20},"i_et":1776493477227}',
}

params = {
    'operationName': 'searchFacetQuery',
    'variables': '{"criteria":{"offset":0,"soldItemsOffset":0,"promotedItemsOffset":0,"sortBy":0,"length":100,"query":"y2k shirt men","categoryIds":null,"brandIds":null,"itemConditions":[],"shippingPayerIds":[],"sizeGroupIds":[],"sizeIds":[],"itemStatuses":[],"customFacets":[],"facetTypes":["category_ids","brand_ids","size_ids","authenticity","condition_ids","item_status","shipping_payer_ids","meetup","country_sources","deals","price"],"authenticities":[],"deliveryType":"all","state":null,"locale":null,"shopPageUri":null,"nationalShippingFeeMin":null,"nationalShippingFeeMax":null,"withCouponOnly":null,"excludeShippingTypes":null,"savedSearchId":null,"meetupDistanceLimit":null,"countrySources":[],"withDealsOnly":false,"showDescription":false}}',
}

response = requests.get('https://www.mercari.com/v1/api', params=params, cookies=cookies, headers=headers)
print(response.text)