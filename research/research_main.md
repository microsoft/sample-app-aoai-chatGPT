# NeuronESの導入事例を答えてくれるチャットボットの実験記録
NeuronESの事例について回答してくれるAIアシスタントを`sample-app-aoai-chatGPT`を使って構築しました。データソースにNeuronESの詳細事例のファイル（.pdf, .pptx）を26件格納しています。これを使って「チャットボットでファイル検索ができるか？」を実験しました。

[アーキテクチャダイヤグラム](https://learn.microsoft.com/ja-jp/azure/architecture/ai-ml/architecture/basic-openai-e2e-chat)<br>
<img src="./image/openai-end-to-end-basic.svg" alt="Example SVG" width="800">

## 構築したチャットボットの動作確認
構築したチャットボットの構成は下記になっています。<br>
```26ファイル -> Azure Blob storage -> Azure AI Search(前処理 -> ベクトル化 -> インデックス -> セマンティック検索) -> App Service（Webアプリ) <-> Azure OpenAI Service(Azure OpenAI Model)
```

構築したチャットボットのパラメーターは以下になっています。<br>

### Search Serviceのスキルセット<br>
#### チャンク設定
```"@odata.type": "#Microsoft.Skills.Text.SplitSkill",
"description": "Split skill to chunk documents",
"defaultLanguageCode": "ja",
"textSplitMode": "pages",
"maximumPageLength": 2000,
"pageOverlapLength": 500,
```
#### ベクトル化
```"@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill",
"deploymentId": "text-embedding-3-large",
"dimensions": 3072,
```

Webアプリの環境変数の一部
|名前|値|
|---|--|
|AZURE_OPENAI_MAX_TOKENS|2000|
|AZURE_OPENAI_MODEL|gpt-4o|
|AZURE_OPENAI_MODEL|gpt-4o|
|AZURE_SEARCH_QUERY_TYPE|vector_semantic_hybrid|
|AZURE_SEARCH_STRICTNESS|3|
|AZURE_SEARCH_TOP_K|5|

|AZURE_OPENAI_EMBEDDING_NAME|text-embedding-3-large|


パラメーターの設定変更による回答内容の変化を確認する
- 基本的にはAzure上に作ったチャットボットを使う。Azure OpenAI ServiceとAzure AI Searchを利用する。
- 比較のために、Difyで作ったチャットボットも利用する。LLMやEmbeddingはAzure OpenAI Serviceを利用する。

#### チャンキングの影響
#### Embeddingモデルの影響
#### [セマンティック検索のtop-kの影響](./research-semantic-search.md)
#### LLMのモデルの違いによる回答精度の違いと回答速度の違い
#### LLMのパラメーターの影響





