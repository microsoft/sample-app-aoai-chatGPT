from typing import Dict, Any
from dataclasses import dataclass
import os


@dataclass
class UserSecurityContext:
    EndUserId: str
    SourceIp: str
    ApplicationName: str
    TenantId: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert the security context to a dictionary for JSON serialization"""
        return {
            "application_name": self.ApplicationName,
            "end_user_id": self.EndUserId,
            "source_ip": self.SourceIp,
            "tenant_id": self.TenantId
        }
            

def get_msdefender_user_json(authenticated_user_details, request_headers, application_name) -> UserSecurityContext:
    source_ip = request_headers.get('Remote-Addr', '')
    tenant_id = os.environ.get("AZURE_TENANT_ID")
    EndUserID = authenticated_user_details.get('user_principal_id')
    SourceIP= source_ip.split(':')[0]
    return UserSecurityContext(EndUserId=EndUserID, SourceIp=SourceIP, ApplicationName=application_name, TenantId=tenant_id)

