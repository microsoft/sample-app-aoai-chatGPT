import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from quart import request, jsonify
from functools import wraps

SECRET_KEY = "Oy32CH1CenliNBSJLcVA1"

def token_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Decode and verify the JWT
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Attach user info from the token payload if needed
            request.user = decoded_token
            
        except ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

        return await f(*args, **kwargs)
    return decorated_function
