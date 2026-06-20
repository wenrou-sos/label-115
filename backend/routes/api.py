from flask import Blueprint, jsonify, request

from services.data_service import DataService

api_bp = Blueprint('api', __name__, url_prefix='/api')
data_service = DataService()


def success_response(data, message='success'):
    return jsonify({
        'code': 0,
        'message': message,
        'data': data
    })


@api_bp.route('/overview', methods=['GET'])
def get_overview():
    data = data_service.get_overview()
    return success_response(data)


@api_bp.route('/category', methods=['GET'])
def get_category():
    data = data_service.get_categories()
    return success_response(data)


@api_bp.route('/region', methods=['GET'])
def get_region():
    region_filter = request.args.get('region', 'all')
    data = data_service.get_regions(region_filter)
    return success_response(data)


@api_bp.route('/price-range', methods=['GET'])
def get_price_range():
    data = data_service.get_price_ranges()
    return success_response(data)


@api_bp.route('/age-group', methods=['GET'])
def get_age_group():
    data = data_service.get_age_groups()
    return success_response(data)


@api_bp.route('/festival', methods=['GET'])
def get_festival():
    data = data_service.get_festivals()
    return success_response(data)


@api_bp.route('/import-compare', methods=['GET'])
def get_import_compare():
    data = data_service.get_import_compare()
    return success_response(data)


@api_bp.route('/reload', methods=['POST'])
def reload_data():
    data_service.reload()
    return success_response({'reloaded': True})
