from quart import Blueprint, jsonify, request

bp = Blueprint('status_blueprint', __name__)

status_message = "Generating answer..."

def set_status_message(new_status):
    global status_message
    status_message = new_status

@bp.route('/update_status', methods=['POST'])
async def update_status():
    global status_message
    data = await request.json
    status_message = data.get('status_message', '')
    return jsonify(success=True)

@bp.route('/get_status', methods=['GET'])
async def get_status():
    return jsonify(status_message=status_message)
