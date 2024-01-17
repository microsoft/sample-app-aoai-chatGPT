import os
from applicationinsights.flask.ext import AppInsights

class AppInsightsMiddleware:
    """Middleware for integrating Application Insights with a Flask application."""

    def __init__(self, app, instrumentation_key = "") -> None:
        self.app = app
        self.instrumentation_key = os.environ.get('AZURE_APPINSIGHTS_INSTRUMENTATIONKEY') or instrumentation_key

        if not self.instrumentation_key:
            raise ValueError("An instrumentation key must be provided via the environment variable 'APPINSIGHTS_INSTRUMENTATIONKEY' or the 'instrumentation_key' argument.")

        app.config['APPINSIGHTS_INSTRUMENTATIONKEY'] = self.instrumentation_key
        self.appinsights = AppInsights(app)