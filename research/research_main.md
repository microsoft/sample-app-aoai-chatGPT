# NeuronESの導入事例を答えてくれるチャットボットの実験記録
NeuronESの事例について回答してくれるAIアシスタントを`sample-app-aoai-chatGPT`を使って構築しました。データソースにNeuronESの詳細事例のファイル（.pdf, .pptx）を26件格納しています。これを使って「チャットボットでファイル検索ができるか？」を実験しました。

[アーキテクチャダイヤグラム](https://learn.microsoft.com/ja-jp/azure/architecture/ai-ml/architecture/basic-openai-e2e-chat)<br>
<img src="./image/openai-end-to-end-basic.svg" alt="Example SVG" width="800">

## 構築したチャットボットの動作確認
構築したチャットボットのパラメーターは以下になっています。
|名前|値|
|---|--|
|AZURE_OPENAI_EMBEDDING_NAME|text-embedding-3-large|


パラメーターの設定変更による回答内容の変化を確認する
- 基本的にはAzure上に作ったチャットボットを使う。Azure OpenAI ServiceとAzure AI Searchを利用する。
- 比較のために、Difyで作ったチャットボットも利用する。LLMやEmbeddingはAzure OpenAI Serviceを利用する。

#### チャンキングの影響
#### Embeddingモデルの影響
#### [セマンティック検索のtop-kの影響](./research-semantic-search.md)
#### LLMのモデルの違いによる回答精度の違いと回答速度の違い
#### LLMのパラメーターの影響





