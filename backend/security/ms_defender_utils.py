import json

def get_msdefender_user_json(authenticated_user_details, request_headers):
    auth_provider = authenticated_user_details.get('auth_provider')
    source_ip = request_headers.get('X-Forwarded-For', request_headers.get('Remote-Addr', ''))
    user_args = {
        "EndUserId": authenticated_user_details.get('user_principal_id'),
        "EndUserIdType": "EntraId" if auth_provider == "aad" else auth_provider,
        "SourceIp": source_ip.split(':')[0], #remove port
    }
    return json.dumps(user_args)