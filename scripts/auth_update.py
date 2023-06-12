import argparse
import subprocess

from azure.identity import AzureDeveloperCliCredential
import urllib3


def update_redirect_uris(credential, app_id, uri):
    urllib3.request(
        "PATCH",
        f"https://graph.microsoft.com/v1.0/applications/{app_id}",
        headers={
            "Authorization": "Bearer "
            + credential.get_token("https://graph.microsoft.com/.default").token,
        },
        json={
            "web": {
                "redirectUris": [
                    "http://localhost:5000/.auth/login/aad/callback",
                    f"{uri}/.auth/login/aad/callback",
                ]
            }
        },
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Prepare documents by extracting content from PDFs, splitting content into sections and indexing in a search index.",
        epilog="Example: prepdocs.py --searchservice mysearch --index myindex",
    )
    parser.add_argument(
        "--appid",
        required=False,
        help="Required. ID of the application to update.",
    )
    parser.add_argument(
        "--uri",
        required=False,
        help="Required. URI of the deployed application.",
    )
    args = parser.parse_args()

    credential = AzureDeveloperCliCredential()
    update_redirect_uris(credential, args.appid, args.uri)
