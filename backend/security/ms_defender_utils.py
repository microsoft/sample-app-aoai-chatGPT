from typing import Dict, Any
from dataclasses import dataclass, asdict, field
import os


@dataclass
class UserSecurityContext:
    application_name: str = field(default=None)    
    end_user_id: str = field(default=None)
    end_user_tenant_id: str = field(default=None)
    source_ip: str = field(default=None)
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}
            

def get_msdefender_user_json(authenticated_user_details, request_headers, application_name) -> UserSecurityContext:
    source_ip = request_headers.get('Remote-Addr', '')
    end_user_id = authenticated_user_details.get('user_principal_id')
    source_ip= source_ip.split(':')[0]
    return UserSecurityContext(end_user_id=end_user_id, source_ip=source_ip, application_name=application_name, end_user_tenant_id=None)

