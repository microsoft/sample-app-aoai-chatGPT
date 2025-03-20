from typing import Dict, Any
from dataclasses import dataclass, asdict, field
import os


@dataclass
class UserSecurityContext:
    application_name: str = field(default="default_app")    
    end_user_id: str = field(default="00000000-0000-0000-0000-000000000000")
    end_user_tenant_id: str = field(default="00000000-0000-0000-0000-000000000000")
    source_ip: str = field(default="0.0.0.0")
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
            

def get_msdefender_user_json(authenticated_user_details, request_headers, application_name, tenant_id) -> UserSecurityContext:
    source_ip = request_headers.get('Remote-Addr', '')
    end_user_id = authenticated_user_details.get('user_principal_id')
    source_ip= source_ip.split(':')[0]
    return UserSecurityContext(end_user_id=end_user_id, source_ip=source_ip, application_name=application_name, tenant_id=tenant_id)

