import subprocess

from azure.identity import AzureDeveloperCliCredential
import urllib3

credential = AzureDeveloperCliCredential()

resp = urllib3.request(
    "POST",
    "https://graph.microsoft.com/v1.0/applications",
    headers={
        "Authorization": "Bearer "
        + credential.get_token("https://graph.microsoft.com/.default").token,
    },
    json={
        "displayName": "WebApp",
        "signInAudience": "AzureADandPersonalMicrosoftAccount",
        "web": {"redirectUris": ["http://localhost:5000/.auth/login/aad/callback"]},
    },
    timeout=urllib3.Timeout(connect=10, read=10),
)

app_id = resp.json()["id"]
client_id = resp.json()["appId"]

# Add a client secret to the application
# using https://graph.microsoft.com/v1.0/applications/{id}/addPassword
# where {id} is the application ID returned from the previous step
resp = urllib3.request(
    "POST",
    f"https://graph.microsoft.com/v1.0/applications/{app_id}/addPassword",
    headers={
        "Authorization": "Bearer "
        + credential.get_token("https://graph.microsoft.com/.default").token,
    },
    json={"passwordCredential": {"displayName": "WebAppSecret"}},
    timeout=urllib3.Timeout(connect=10, read=10),
)
client_secret = resp.json()["secretText"]

subprocess.run(f"azd env set AUTH_APP_ID {app_id}", shell=True)
subprocess.run(f"azd env set AUTH_CLIENT_ID {client_id}", shell=True)
subprocess.run(f"azd env set AUTH_CLIENT_SECRET {client_secret}", shell=True)
