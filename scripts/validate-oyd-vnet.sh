#!/bin/bash -e

function get_resource() {
    resource_id=$1
    api_version=$2

    az rest --method get --uri $resource_id?api-version=$api_version
}

function get_resource_id_from_resource() {
    echo "${1}" | jq '.id' | tr -d '"'
}

function get_resource_type_from_resource() {
    echo "${1}" | jq '.type' | tr -d '"'
}

function check_resource_type() {
    resource=$1
    expected_type=$2
    resource_id=$(get_resource_id_from_resource "$resource")
    actual_type=$(get_resource_type_from_resource "$resource")

    if [[ $actual_type != $expected_type ]]; then
        echo "Resource with ID ${resource_id} is not the correct type -- was expecting type ${expected_type}"
        exit 1
    fi
}

function check_user_mi_roles() {
    subscription_id=$1
    user_principal=$2
    expected_roles=$3

    echo "Checking MI roles for signed in user"

    role_assignments=$(az role assignment list --subscription $subscription_id --assignee $user_principal --all --query="[].roleDefinitionName")
    unmatched_role_assignments_count=$(echo $role_assignments | jq --argjson expected "$expected_roles" '$expected-. | length')

    if [[ $unmatched_role_assignments_count > 0 ]]; then
        echo "Signed-in user does not have the correct role assignments."
        echo "Expected role assignments: ${expected_roles}"
        echo "Actual role assignments: ${role_assignments}"
        echo "Please run the following script to ensure that role assignments are set correctly for your user identity: https://github.com/microsoft/sample-app-aoai-chatGPT/blob/main/scripts/role_assignment.sh"
        exit 1
    fi

    echo "MI roles for signed in user are valid!"
}

function check_mi_roles() {
    subscription_id=$1
    resource=$2
    expected_roles=$3
    scope=$4
    resource_id=$(get_resource_id_from_resource "$resource")
    resource_type=$(get_resource_type_from_resource "$resource")
    identity_principal=$(echo $resource | jq '.identity_principal' | tr -d '"')
    echo "Checking MI roles for resource ${resource_id}"
    echo "Identity principal: ${identity_principal}"

    if [[ $identity_principal == "null" ]]; then
        echo "Resource with ID ${resource_id} does not have an assigned managed identity."

        if [[ $resource_type == "Microsoft.Search/searchServices" ]]; then
            echo "Please follow the documentation here to set up an assigned managed identity for your search resource: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#enable-managed-identity-1"
            exit 1
        elif [[ $resource_type == "Microsoft.CognitiveServices/accounts" ]]; then
            echo "Please follow the documentation here to set up an assigned managed identity for your AOAI resource: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#enable-managed-identity"
            exit 1
        elif [[ $resource_type == "Microsoft.Storage/storageAccounts" ]]; then
            echo "Managed identity not needed for storage accounts -- nothing to do."
        fi
    else
        role_assignments=$(az role assignment list --subscription $subscription_id --assignee $identity_principal --all --query="[].roleDefinitionName")
        unmatched_role_assignments_count=$(echo $role_assignments | jq --argjson expected "$expected_roles" '$expected-. | length')

        if [[ $unmatched_role_assignments_count > 0 ]]; then
            echo "Resource with ID ${resource_id} does not have the correct role assignments."
            echo "Expected role assignments: ${expected_roles}"
            echo "Actual role assignments: ${role_assignments}"
            echo "Please run the following script to ensure that role assignments are set correctly for your resources: https://github.com/microsoft/sample-app-aoai-chatGPT/blob/main/scripts/role_assignment.sh"
            exit 1
        fi
    fi

    echo "MI roles for resource ${resource_id} are valid!"
}

function check_role_assignment_scope() {
    subscription_id=$1
    resource=$2
    role_name=$3
    expected_scope=$4
    resource_id=$(get_resource_id_from_resource "$resource")
    identity_principal=$(echo $resource | jq '.identity_principal' | tr -d '"')

    echo "Checking scope ${expected_scope} for role ${role_name} on resource ${resource_id}"

    scope=$(az role assignment list --subscription $subscription_id --assignee $identity_principal --all | jq --arg role "$role_name" 'map(select(.roleDefinitionName==$role)) | .[].scope')
    has_resource_scope=$(echo $scope | jq --arg expected_scope "$expected_scope" '.==$expected_scope')
    has_subscription_scope=$(echo $scope | jq --arg expected_scope "/subscriptions/$subscription_id" '.==$expected_scope')

    if [[ $has_resource_scope == "false" && $has_subscription_scope == "false" ]]; then
        echo "Role '$role_name' for resource '$resource_id' is missing the correct scope."
        echo "Please run the following script to ensure that role assignments are set correctly for your resources: https://github.com/microsoft/sample-app-aoai-chatGPT/blob/main/scripts/role_assignment.sh"
        exit 1
    fi

    echo "Role assignment scope is valid!"
}

function check_resources_subnet_connection() {
    subscription_id=$1
    vnet=$2
    resources=$3
    echo "Checking resources subnet connection to vnet..."
    # JSON string representing a list of resource IDs
    resource_ids=$(echo $resources | jq '.[].id' | jq -s)

    # JSON string representing a list of subnets for which all of the above resources are associated through "Approved" private endpoint connections
    resources_subnets=$(echo $resources | jq '.[].private_endpoints | flatten | .[].properties.privateEndpoint.id' | tr -d '"' | xargs az network private-endpoint show --subscription $subscription_id --ids 2>/dev/null | jq '.[] | select(any(.privateLinkServiceConnections[]; .privateLinkServiceConnectionState.status == "Approved"))' | jq -s 'group_by(.subnet.id)[] | {(.[0].subnet.id): [.[] | .privateLinkServiceConnections[].privateLinkServiceId]}' | jq --argjson ids "$resource_ids" 'map_values($ids-.) | to_entries | .[].key')

    resources_subnets_count=$(echo $resources_subnets | jq -s 'length')
    if [[ $resources_subnet_count == 0 ]]; then
        echo "The given resources are not all connected to the same virtual network subnet via private endpoint connections.  Please check that each resource has a private endpoint connection to a subnet in your virtual network and try again."
        exit 1
    fi

    echo "All resources are connected to the following subnet: $resources_subnets"
}

function check_gateway_subnet_connection() {
    vnet_id=$1
    gateway_resource=$2
    gateway_resource_id=$(get_resource_id_from_resource "$gateway_resource")
    echo "Checking VPN gateway is connected to virtual network"

    gateway_subnet_is_in_vnet=$(echo $gateway_resource | jq --arg vnet_id $vnet_id '.properties.ipConfigurations[].properties.subnet.id | contains($vnet_id)')

    if [[ $gateway_subnet_is_in_vnet != "true" ]]; then
        echo "The VPN gateway $gateway_resource_id is not in a subnet of virtual network $vnet_id -- please follow the instructions here to configure the VPN gateway.  https://learn.microsoft.com/en-us/azure/vpn-gateway/tutorial-create-gateway-portal#VNetGateway"
    fi

    echo "VPN gateway is attached to the virtual network!"
}

function check_microsoft_managed_vnet_private_endpoint_connection() {
    echo "Checking Microsoft-managed private endpoint connection..."
    resource=$1

    ms_private_endpoint_connections=$(echo $resource | jq '.private_endpoints | map(select(.properties.privateEndpoint.id | startswith("/subscriptions/812f15d0-6b38-42a1-a3cf-fa00794f528b")))')
    ms_private_endpoint_connections_count=$(echo $ms_private_endpoint_connections | jq 'length')

    if [[ $ms_private_endpoint_connections_count == 0 ]]; then
        echo "No AOAI On Your Data-hosted private endpoint connection found"
        echo "Please follow instructions here to request private endpoint access for your resource: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#disable-public-network-access-1"
        exit 1
    fi

    approved_private_endpoint_count=$(echo $ms_private_endpoint_connections | jq 'map(select(.properties.privateLinkServiceConnectionState.status=="Approved")) | length')
    pending_private_endpoint_count=$(echo $ms_private_endpoint_connections | jq 'map(select(.properties.privateLinkServiceConnectionState.status=="Pending")) | length')

    if [[ $approved_private_endpoint_count == 0 ]]; then
        if [[ $pending_private_endpoint_count == 0 ]]; then
            echo "No AOAI On Your Data-hosted private endpoint connection found"
            echo "Please follow instructions here to request private endpoint access for your resource: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#disable-public-network-access-1"
            exit 1
        else
            echo "One or more AOAI On Your Data-hosted private endpoint connections was found for the provided Azure Search resource, but they are not in an approved state."
            echo "Please navigate to the 'Networking' section of the resource page in the Azure portal to approve any pending connections and re-run this script."
            exit 1
        fi
    fi

    echo "Microsoft-managed private endpoint connection is valid!"
}

function check_bypass_azure_services_configuration() {
    resource=$1
    resource_id=$(get_resource_id_from_resource "$resource")
    resource_type=$(get_resource_type_from_resource "$resource")

    echo "Checking trusted services configuration via network bypass settings for resource $resource_id"

    bypass_azure_services=$(echo $resource | jq '.network_acls.bypass=="AzureServices" and .network_acls.defaultAction=="Deny"')

    if [[ $bypass_azure_services != "true" ]]; then
        echo "Missing trusted services configuration for resource $resource_id"
        if [[ $resource_type == "Microsoft.Storage/storageAccounts" ]]; then
            echo "Please review the documentation here to properly configure trusted services for a storage account: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#enable-trusted-service-1"
            exit 1
        elif [[ $resource_type == "Microsoft.CognitiveServices/accounts" ]]; then
            echo "Please review the documentation here to properly configure trusted services for a Cognitive Services account: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#enable-trusted-service"
            exit 1
        else
            echo "Bypass services configuration isn't relevant for resource $resource_id -- nothing to do."
        fi
    fi

    echo "Success!"
}

function check_rbac() {
    resource=$1
    resource_id=$(get_resource_id_from_resource "$resource")

    rbac_settings=$(echo $resource | jq '.auth_options.aadOrApiKey?')

    if [[ $rbac_settings == "null" ]]; then
        echo "RBAC settings for resource ${resource_id} are incorrect -- please follow the instructions here and try again.  https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/use-your-data-securely#enable-role-based-access-control"
    fi

    echo "RBAC settings for resource ${resource_id} are correct!"
}

# script usage info
function usage() {
    cat <<USAGE

    Usage: $0 
        --subscription-id <subscription_id>
        --azure-openai-resource-id <aoai_resource_id>
        --azure-search-resource-id <search_resource_id>
        --storage-account-resource-id <storage_account_resource_id>
        --virtual-network-resource-id <virtual_network_resource_id>
        --virtual-network-gateway-resource-id <gateway_resource_id>
        [--log-details]

    Options:
        --subscription-id:                       Required.
        --azure-openai-resource-id:              Required.
        --azure-search-resource-id:              Required.
        --storage-account-resource-id:           Required.
        --virtual-network-resource-id:           Required.
        --virtual-network-gateway-resource-id:   Required.
        --log-details:                           Optional.
USAGE
    exit 1
}

# check that required tools are installed
which az 1>/dev/null

if [[ $? != 0 ]]; then
    echo "az CLI not found on PATH -- please install the az CLI and try again."
    exit 1
fi

which jq 1>/dev/null

if [[ $? != 0 ]]; then
    echo "jq not found on PATH -- please install the jq command using your distribution's package manager and try again."
    exit 1
fi

# process args
LOG_DETAILS=0
if [[ "$1" == "" ]]; then
    usage
    exit 1
fi

while [ "$1" != "" ]; do
    case $1 in
    --subscription-id)
        shift;
        subscription_id=$1
        ;;
    --azure-openai-resource-id)
        shift;
        aoai_resource_id=$1
        ;;
    --azure-search-resource-id)
        shift;
        search_resource_id=$1
        ;;
    --storage-account-resource-id)
        shift;
        storage_account_resource_id=$1
        ;;
    --virtual-network-resource-id)
        shift;
        virtual_network_resource_id=$1
        ;;
    --virtual-network-gateway-resource-id)
        shift;
        gateway_resource_id=$1
        ;;
    --log-details)
        LOG_DETAILS=1
        ;;
    *)
        echo "Invalid arguments: $1"
        usage
        exit 1
        ;;
    esac
    shift
done

# validate required args
if [[ -z "$subscription_id" ]]; then
    echo "--subscription-id is a required argument"
    usage

elif [[ -z "$aoai_resource_id" ]]; then
    echo "--azure-openai-resource-id is a required argument"
    usage

elif [[ -z "$search_resource_id" ]]; then
    echo "--azure-search-resource-id is a required argument"
    usage

elif [[ -z "$storage_account_resource_id" ]]; then
    echo "--storage-account-resource-id is a required argument"
    usage

elif [[ -z "$virtual_network_resource_id" ]]; then
    echo "--virtual-network-resource-id is a required argument"
    usage

elif [[ -z "$gateway_resource_id" ]]; then
    echo "--virtual-network-gateway-resource-id is a required argument"
    usage

fi

# Get signed-in user principal ID
user_principal=$(az ad signed-in-user show --query "id" -o tsv)

# JSON filters
jmes_vnet_query_string="{\
type: type, \
subnets: properties.subnets[].{id: id, ip_configs: properties.ipConfigurations, private_endpoints: properties.privateEndpoints}\
}"

jq_filter="{id:.id,type:.type,auth_options:.properties.authOptions,private_endpoints:.properties.privateEndpointConnections,identity_principal:.identity.principalId,network_acls:.properties.networkAcls}"


# get resources info and verify resource types match expectation
acs_resource=$(get_resource $search_resource_id "2023-11-01"  | jq -c $jq_filter)
if [[ $(get_resource_type_from_resource "$acs_resource") != "Microsoft.Search/searchServices" ]]; then
    echo "The value given for --azure-search-resource-id is not a valid Azure Search resource ID."
    exit 1
fi

aoai_resource=$(get_resource $aoai_resource_id "2023-10-01-preview"  | jq -c $jq_filter)
if [[ $(get_resource_type_from_resource "$aoai_resource") != "Microsoft.CognitiveServices/accounts" ]]; then
    echo "The value given for --azure-openai-resource-id is not a valid Azure OpenAI resource ID."
    exit 1
fi

storage_resource=$(get_resource $storage_account_resource_id "2023-05-01"  | jq -c $jq_filter)
if [[ $(get_resource_type_from_resource "$storage_resource") != "Microsoft.Storage/storageAccounts" ]]; then
    echo "The value given for --storage-account-resource-id is not a valid storage account resource ID."
    exit 1
fi

virtual_network_resource=$(az resource show --subscription $subscription_id --ids $virtual_network_resource_id --query="${jmes_vnet_query_string}")
if [[ $(get_resource_type_from_resource "$virtual_network_resource") != "Microsoft.Network/virtualNetworks" ]]; then
    echo $virtual_network_resource | jq
    echo "The value given for --virtual-network-resource-id is not a valid Azure Search resource ID."
    exit 1
fi

gateway_resource=$(az resource show --subscription $subscription_id --ids $gateway_resource_id)
if [[ $(get_resource_type_from_resource "$gateway_resource") != "Microsoft.Network/virtualNetworkGateways" ]]; then
    echo "The value given for --gateway-resource-id is not a valid Azure Search resource ID."
    exit 1
fi

data_resources=$(jq -n -c --argjson sa "$storage_resource" --argjson acs "$acs_resource" --argjson aoai "$aoai_resource" '[$sa, $acs, $aoai]')

# verify trusted services configuration.
check_bypass_azure_services_configuration "$storage_resource"
check_bypass_azure_services_configuration "$aoai_resource"

# verify network topology (vnet + private endpoints configuration).
# 1) VNET has private endpoint connection to each resource, and each are approved by the user.
check_resources_subnet_connection $subscription_id "$virtual_network_resource" "$data_resources"

# 2) VNET also has a VPN gateway attached to it.
check_gateway_subnet_connection $virtual_network_resource_id "$gateway_resource"

# 3) Additional private endpoint connection to Microsoft-managed VNET exists on search resource.
check_microsoft_managed_vnet_private_endpoint_connection "$acs_resource"

# verify roles and scopes on each item, and on the logged in user.
check_user_mi_roles $subscription_id $user_principal "[\"Cognitive Services OpenAI Contributor\"]"
check_mi_roles $subscription_id "$acs_resource" "[\"Cognitive Services OpenAI Contributor\",\"Storage Blob Data Contributor\"]"
check_role_assignment_scope $subscription_id "$acs_resource" "Cognitive Services OpenAI Contributor" $aoai_resource_id
check_role_assignment_scope $subscription_id "$acs_resource" "Storage Blob Data Contributor" $storage_account_resource_id
check_mi_roles $subscription_id "$aoai_resource" "[\"Search Index Data Reader\",\"Search Service Contributor\",\"Storage Blob Data Contributor\"]"
check_role_assignment_scope  $subscription_id "$aoai_resource" "Search Index Data Reader" $search_resource_id
check_role_assignment_scope  $subscription_id "$aoai_resource" "Search Service Contributor" $search_resource_id
check_role_assignment_scope  $subscription_id "$aoai_resource" "Storage Blob Data Contributor" $storage_account_resource_id

# check that ACS resource has both API key + RBAC enabled
check_rbac "$acs_resource"

echo "Successfully validated all resources!"