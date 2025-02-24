# NeuronESの導入事例を答えてくれるチャットボットの実験記録
NeuronESの事例について回答してくれるAIアシスタントを`sample-app-aoai-chatGPT`を使って構築しました。<br>
データソースにNeuronESの詳細事例のファイル（.pdf, .pptx）を26件格納しています。<br>
これを使って「チャットボットでファイル検索ができるか？」を実験した記録です。<br>

[アーキテクチャダイヤグラム](https://learn.microsoft.com/ja-jp/azure/architecture/ai-ml/architecture/basic-openai-e2e-chat)<br>
<img src="./image/openai-end-to-end-basic.svg" alt="Example SVG" width="800">

この実験の結果を参考にしていただきたい方
- 生成AIを使ったチャットボットのサービスをご利用の方
- Microsoft 365 Copilotを評価している方（基本的に、本実験で構築したチャットボットが使っているAzureのサービスで構成されていると考えられるため）
- AzureやAWSで生成AIを使ったチャットボットを構築された方
- Box AIやDropbox Dashの利用を検討している方

## 構築したチャットボットのパラメーター設定
構築したチャットボットの構成は下記になっています。<br>
26ファイル -> Azure Blob storage -> Azure AI Search(前処理 -> ベクトル化 -> インデックス -> セマンティック検索) -> App Service（Webアプリ) <-> Azure OpenAI Service(Azure OpenAI Model)<br>
**ここに図を入れる**
<br>
構築したチャットボットのパラメーターは以下になっています。<br>
### Search Serviceのスキルセット
#### 前処理(チャンク設定)
<!--
"@odata.type": "#Microsoft.Skills.Text.SplitSkill",
"description": "Split skill to chunk documents",
"defaultLanguageCode": "ja",
"textSplitMode": "pages",
"maximumPageLength": 2000,
"pageOverlapLength": 500,
-->
`"@odata.type": "#Microsoft.Skills.Text.SplitSkill"`
|パラメーター名|値|
|:-----------|:--|
|defaultLanguageCode|ja|
|textSplitMode|pages|
|maximumPageLength|2000|
|pageOverlapLength|500|

#### ベクトル化
<!--
"@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill",
"deploymentId": "text-embedding-3-large",
"dimensions": 3072,
-->
`"@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill"`
|パラメーター名|値|
|:-----------|:--|
|deploymentId|text-embedding-3-large|
|dimensions|3072|


### Webアプリの環境変数（一部）
#### 検索
|名前|値|
|:---|:--|
|AZURE_SEARCH_QUERY_TYPE|vector_semantic_hybrid|
|AZURE_SEARCH_STRICTNESS|3|
|AZURE_SEARCH_TOP_K|5|

セマンティックランカー Free 1か月あたりのリクエストが 1,000件を使用<br>

#### LLM
|名前|値|
|:---|:--|
|AZURE_OPENAI_MAX_TOKENS|2000|
|AZURE_OPENAI_MODEL|gpt-4o|
|AZURE_OPENAI_EMBEDDING_NAME|text-embedding-3-large|
|AZURE_OPENAI_SYSTEM_MESSAGE|Neuron ESの導入事例の情報を見つけるのに役立つ AI アシスタントです。回答には出典元ファイルのurlをつけてください。|
|AZURE_OPENAI_TEMPERATURE|0|
|AZURE_OPENAI_TOP_P|0|
<br>

## 構築したチャットボットの動作確認
上記のパラメーターで構築したチャットボットに質問した時の回答内容の結果とNeuronESの場合の結果との比較を示します。

|No.|プロンプト|目的|結果|NeuronESの場合|
|:--|:-------|:--|:--|:-----------|
|1|Neuronの導入事例を探してください|回答する事例の数を確認|1つの事例しか回答しない|26の事例を結果に表示する|
|2|SharePointを検索対象にした導入事例を探してください|2つの事例を回答するか確認||大和ハウス工業とトインクスの事例を結果に表示する|
|3|SPOを検索対象にした導入事例を探してください|「SPO」を「SharePoint Online」として回答できるか確認（あいまい検索）||類義語登録が必要|
|4|Neuronの導入事例を10社分探してください||事例を10個回答するか確認|結果に表示する事例の数は指定できないが10個以上の事例を表示|
|5|



## パラメーターの設定変更による回答内容の変化の実験
- 基本的にはAzure上に作ったチャットボットを使う。Azure OpenAI ServiceとAzure AI Searchを利用する。
- 比較のために、Difyで作ったチャットボットも利用する。LLMやEmbeddingはAzure OpenAI Serviceを利用する。Rerankモデルはcohereの`rerank-multilingual-v3.0`。Difyの方は、事例のファイルは7ファイルのみのアップロード。PDFファイルの読み込みで文字化けがひどく、手動で修正した。

|項目|パラメーター|実験値|実験に利用したプロンプトNo.|実験結果|考察|
|:--|:--------|:----|:--------------------|:------|:--|
|チャンキングの影響|前処理(チャンク設定)|実験値|実験に利用したプロンプトNo.|実験結果|考察|
|Embeddingモデルの影響|ベクトル化|実験値|実験に利用したプロンプトNo.|実験結果|考察|
|[セマンティック検索のtop-kの影響](./research-semantic-search.md)|検索|実験値|4|実験結果|考察|
|LLMのモデルの違いによる回答精度の違いと回答速度の違い|LLM|実験値|2|実験結果|考察|
|LLMのパラメーターの影響|LLM|実験値|実験に利用したプロンプトNo.|実験結果|考察|
|LLMの利用料|LLM|実験値|実験に利用したプロンプトNo.|実験結果|考察|





