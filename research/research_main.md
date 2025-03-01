# NeuronESの導入事例を答えてくれるチャットボットの実験記録
NeuronESの事例について回答してくれるAIアシスタントを`sample-app-aoai-chatGPT`を使って構築しました。<br>
データソースにNeuronESの詳細事例のファイル（.pdf, .pptx）を26件格納しています。<br>
これを使って「チャットボットでファイル検索ができるか？」を実験した記録です。<br>

[アーキテクチャダイヤグラム](https://learn.microsoft.com/ja-jp/azure/architecture/ai-ml/architecture/basic-openai-e2e-chat)<br>
<img src="./image/openai-end-to-end-basic.svg" alt="Example SVG" width="800">

この実験の結果を参考にしていただきたい方
- 生成AIを使ったチャットボットのサービスをご利用の方
- Microsoft 365 Copilotを評価している方（Copilotが内部で利用しているサービスが本実験で構築したチャットボットが使っているAzureのサービスと似ていると考えられるため）
- AzureやAWSで生成AIを使ったチャットボットを構築された方
- Box AIやDropbox Dashの利用を検討している方

## 構築したチャットボットの動作確認
構築したチャットボットに質問した時の回答内容の結果とNeuronESの場合の結果との比較を示します。

|No.|プロンプト|目的|結果|NeuronESの場合|
|:--|:-------|:--|:--|:-----------|
|1|Neuronの導入事例を探してください|回答する事例の数を確認|1つの事例しか回答しない|26の事例を結果に表示する|
|2|SharePointを検索対象にした導入事例を探してください|2つの事例を回答するか確認||大和ハウス工業とトインクスの事例を結果に表示する|
|3|SPOを検索対象にした導入事例を探してください|「SPO」を「SharePoint Online」として回答できるか確認（あいまい検索）||類義語登録が必要|
|4|Neuronの導入事例を10社分探してください|10社分の事例を回答するか確認||結果に表示する事例の数は指定できないが10個以上の事例を表示|
|5|


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

## 料金に関する考察
チャットボットの料金の分析
|項目|利用サービス|コスト|考察|
|:--|:---------|:--|:--|
|ベクトルデータベース・検索|Azure AI Search|Japan East $330.34/月 = 51,200円/月（155円/ドル）。26ファイルを最大チャンク長2000, オーバーラップ500でベクトル化した場合、検索インデックス内ドキュメント数54,ストレージ合計2.67MB使用。160万ファイルで合計ストレージ164GBになる。|夜間や休日に停止できない月額固定費。利用人数は関係ない。|
|Webアプリ|App Service|Premium v3 P1V3, 2vCPU, 8GBメモリ、月額137.24 USD=21,272円/月|実験では、Basic B1, 1vCPU, 1.75GBメモリ, 月額13.87 USD=2,150円/月を利用。利用人数によってアップグレード。夜間や休日に止められない月額固定費。|
|LLM・ベクトル化|Azure OpenAI Service|
|トータルコスト|
