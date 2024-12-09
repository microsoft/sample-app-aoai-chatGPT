while getopts ":s:o:a:" opt; do
  case $opt in
    s) search_service_resource_id="$OPTARG"
    ;;
    o) azure_openai_resource_id="$OPTARG"
    ;;
    a) storage_account_resource_id="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

echo "search_service_resource_id=$search_service_resource_id"
echo "azure_openai_resource_id=$azure_openai_resource_id"
echo "storage_account_resource_id=$storage_account_resource_id"

if [[ -z "$search_service_resource_id" ]]; then
  echo "Must provide search_service_resource_id (-s) argument" 1>&2
  exit 1
fi

if [[ -z "$azure_openai_resource_id" ]]; then
  echo "Must provide azure_openai_resource_id (-o) argument" 1>&2
  exit 1
fi

if [[ -z "$storage_account_resource_id" ]]; then
  echo "Must provide storage_account_resource_id (-a) argument" 1>&2
  exit 1
fi

function get_subscription_id(){
  echo "$1" | cut -d'/' -f3
}

function get_resource_group(){
  echo "$1" | cut -d'/' -f5
}

function get_resource_name(){
  echo "$1" | cut -d'/' -f9
}

function get_azure_openai_resource_system_assigned_identity_principal_id(){
  resource_id="$1"
  az cognitiveservices account identity show -n $(get_resource_name $resource_id) -g $(get_resource_group $resource_id) --subscription $(get_subscription_id $resource_id) --query "principalId" -o tsv
}

function get_azure_search_resource_system_assigned_identity_principal_id(){
  resource_id="$1"
  az search service show -n $(get_resource_name $resource_id) -g $(get_resource_group $resource_id) --subscription $(get_subscription_id $resource_id) --query "identity.principalId" -o tsv
}

function get_system_assigned_identity_principal_id(){
  resource_id="$1"
  resource_type=$(echo "$resource_id" | cut -d'/' -f7)
  if [[ "$resource_type" == "Microsoft.CognitiveServices" ]]; then
    get_azure_openai_resource_system_assigned_identity_principal_id $resource_id
  elif [[ "$resource_type" == "Microsoft.Search" ]]; then
    get_azure_search_resource_system_assigned_identity_principal_id $resource_id
  else
    echo "Unknown resource type $resource_type" 1>&2
    exit 1
  fi
}

function ensure_role_assignment() {
  assignee="$1"
  resource_id="$2"
  role="$3"
  echo "ensure role assignment $role for $assignee on $resource_id"
  principal_id=$(get_system_assigned_identity_principal_id $assignee)
  echo "resolved principal_id=$principal_id"
  az role assignment create \
    --assignee-object-id $principal_id \
    --assignee-principal-type ServicePrincipal \
    --role "$role" \
    --scope "$resource_id" \
    --subscription $(get_subscription_id $resource_id)
}

function get_signed_in_user_id(){
  az ad signed-in-user show --query "id" -o tsv
}

function ensure_role_assignment_for_me() {
  assignee=$(get_signed_in_user_id)
  resource_id="$1"
  role="$2"
  echo "ensure role assignment $role for $assignee on $resource_id"
  az role assignment create \
    --assignee-object-id $assignee \
    --assignee-principal-type User \
    --role "$role" \
    --scope "$resource_id" \
    --subscription $(get_subscription_id $resource_id)
}

ensure_role_assignment $azure_openai_resource_id $search_service_resource_id "Search Service Contributor"
ensure_role_assignment $azure_openai_resource_id $search_service_resource_id "Search Index Data Reader"
ensure_role_assignment $azure_openai_resource_id $storage_account_resource_id "Storage Blob Data Contributor"
ensure_role_assignment $search_service_resource_id $storage_account_resource_id "Storage Blob Data Contributor"
ensure_role_assignment $search_service_resource_id $azure_openai_resource_id "Cognitive Services OpenAI Contributor"
ensure_role_assignment_for_me $azure_openai_resource_id "Cognitive Services OpenAI Contributor"