# NeuronESの導入事例を答えてくれるチャットボットでの実験の記録
`sample-app-aoai-chatGPT`を使ってチャットボットを構築しました。データソースにNeuronESの詳細事例のファイル（.pdf, .pptx）を26件格納し、NeuronESの事例について回答してくれるAIアシスタントとしています。これを使って「チャットボットでファイル検索ができるか？」を実験します。

アーキテクチャダイヤグラム（これでいいのか？）
<img src="research/image/openai-end-to-end-basic.svg" alt="Example SVG" width="500">





パラメーターの設定変更による回答内容の変化を確認する
- 基本的にはAzure上に作ったチャットボットを使う。Azure OpenAI ServiceとAzure AI Searchを利用する。
- 比較のために、Difyで作ったチャットボットも利用する。LLMやEmbeddingはAzure OpenAI Serviceを利用する。

#### チャンキングの影響
#### Embeddingモデルの影響
#### [セマンティック検索のtop-kの影響](./research-semantic-search.md)
#### LLMのモデルの違いによる回答精度の違いと回答速度の違い
#### LLMのパラメーターの影響





