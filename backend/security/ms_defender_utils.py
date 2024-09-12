import json

def get_msdefender_user_json(authenticated_user_details, request_headers, conversation_id, application_name):
    auth_provider = authenticated_user_details.get('auth_provider')
    source_ip = request_headers.get('Remote-Addr', '')
    header_names = ['User-Agent', 'X-Forwarded-For', 'Forwarded', 'X-Real-IP', 'True-Client-IP', 'CF-Connecting-IP']
    user_args = {
        "EndUserId": authenticated_user_details.get('user_principal_id'),
        "EndUserIdType": "EntraId" if auth_provider == "aad" else auth_provider,
        "SourceIp": source_ip.split(':')[0], #remove port
        "SourceRequestHeaders": {header: request_headers[header] for header in header_names if header in request_headers},
        "ConversationId": conversation_id,
        "ApplicationName": application_name,
    }
    return json.dumps(user_args)
