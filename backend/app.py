from flask import Flask
from flask_cors import CORS

from config import Config
from routes.api import api_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={
        r'/api/*': {
            'origins': Config.CORS_ORIGINS,
            'methods': ['GET', 'POST', 'OPTIONS'],
            'allow_headers': ['Content-Type']
        }
    })

    app.register_blueprint(api_bp)

    @app.route('/')
    def index():
        return {
            'name': '中国酒类市场数据分析 API',
            'version': '1.0.0',
            'endpoints': [
                '/api/overview',
                '/api/category',
                '/api/region',
                '/api/price-range',
                '/api/age-group',
                '/api/festival',
                '/api/import-compare'
            ]
        }

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
