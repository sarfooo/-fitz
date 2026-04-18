from scraper.api import GrailedAPI

def search_items(query: str, page: int):
    api = GrailedAPI() # let it always be fresh
    return api.query_items(query, page)
