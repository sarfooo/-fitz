class MercariAPI:
    def __init__(self):
        self.session = self.initalize_session()

    def initalize_session(self):
        session = client.create_session()
        session.headers["x-algolia-application-id"] = self.get_app_id(session)
        session.headers["x-algolia-api-key"] = self.get_api_key(session)
        return session