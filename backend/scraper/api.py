from urllib.parse import quote_plus

import scraper.client as client
import scraper.helper as helper

class GrailedAPI:
    def __init__(self):
        self.session = self.initalize_session()

    def initalize_session(self):
        session = client.create_session()
        session.headers["x-algolia-application-id"] = self.get_app_id(session)
        session.headers["x-algolia-api-key"] = self.get_api_key(session)
        return session

    def get_app_id(self, session):
        try:
            response = session.post("https://www.grailed.com/shop").text
            if 'app_id' not in response:
                return None
            return response.split('app_id":"')[1].split('"')[0]

        except Exception as exception:
            print(f"Error getting grailed app ID: {exception}")
            return None

    def get_api_key(self, session):
        try:
            response = session.post('https://www.grailed.com/api/algolia/keys').json()
            return response["data"]["search_key"]

        except Exception as exception:
            print(f"Error getting algolia keys: {exception}")
            return None

    def query_items(self, query: str, page: int):
        encoded_query = quote_plus(query)
        data = {
            "requests": [
                {
                    "indexName": "Listing_by_listing_quality_production",
                    "params": f'analytics=true&clickAnalytics=true&enableABTest=true&facets=["badges","category_path","category_size","color","condition","department","designers.name","location","price_i","strata"]&getRankingInfo=true&highlightPostTag=__/ais-highlight__&highlightPreTag=__ais-highlight__&hitsPerPage=40&maxValuesPerFacet=165&numericFilters=["price_i>=0","price_i<=1000000"]&page={page}&query={encoded_query}&userToken=461d92c8-5fbf-46d1-a319-5ac59129ea57'
                },
                {
                    "indexName": "Listing_by_listing_quality_production",
                    "params":f'analytics=false&clickAnalytics=false&enableABTest=true&facets=price_i&getRankingInfo=true&highlightPostTag=__/ais-highlight__&highlightPreTag=__ais-highlight__&hitsPerPage=0&maxValuesPerFacet=165&page=0&query={encoded_query}'
                }
            ]
        }
        try:
            response = self.session.post("https://mnrwefss2q-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.3)%3B%20Browser%3B%20instantsearch.js%20(4.75.5)%3B%20react%20(18.2.0)%3B%20react-instantsearch%20(7.13.8)%3B%20react-instantsearch-core%20(7.13.8)%3B%20next.js%20(14.2.33)%3B%20JS%20Helper%20(3.22.5)", json = data,)
            return helper.extract_items_from_response(response.json())

        except Exception as exception:
            print(f"Error querying Grailed: {exception}")
            return None
        
    def get_listing_path(self, item_id: str):
        try:
            pass
            response = self.session.get(f"https://www.grailed.com/listings/{item_id}")
            if response.status_code != 301:
                return None
            
            path = response.headers["Location"]
            if "listings" not in path:
                return None

            return path     

        except Exception as exception:
            print(f"Error querying Grailed: {exception}")
            return None

        
    def get_listing(self, item_id: str):
        try:
            path = self.get_listing_path(item_id)
            if not path:
                return None

            response = self.session.get(f"https://www.grailed.com{path}")
            return helper.extract_listing_item_from_html(
                response.text,
                item_id = item_id,
                product_url = f"https://www.grailed.com{path}",
            )

        except Exception as exception:
            print(f"Error querying Grailed: {exception}")
            return None
        
if __name__ == "__main__":
    print(GrailedAPI().get_listing("95602777"))
