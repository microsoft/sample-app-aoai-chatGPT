### Azure OpenAI On Your Data
セマンティック検索に関する記述<br>
https://learn.microsoft.com/ja-jp/azure/ai-services/openai/concepts/use-your-data?tabs=ai-search%2Ccopilot#runtime-parameters

### Azure AI Search でのセマンティック ランク付け
https://learn.microsoft.com/ja-jp/azure/search/semantic-search-overview<br>
#### 取得するドキュメントの数を変更したい時

取得したドキュメント<br>
このパラメーターは、3、5、10、または 20 に設定できる整数であり、最終的な応答を作成するために大規模言語モデルに提供されるドキュメント チャンクの数を制御します。既定では、5 に設定されます。<br>
チャット　プレイグラウンドで設定可能<br>
<img width="250" alt="スクリーンショット 2025-02-17 23 21 37" src="https://github.com/user-attachments/assets/dcb05f3f-c667-4a3c-8dc9-3754fc5fb9ee" />

デプロイしたアプリの環境変数`AZURE_SEARCH_TOP_K`でも確認可能<br>
<img width="500" alt="スクリーンショット 2025-02-17 23 38 21" src="https://github.com/user-attachments/assets/60880606-b48c-4e27-9ede-352bf7b60839" />


### 実験１
5つと指定したとき、同じ事例を拾ってきてしまう。<br>
<img width="500" alt="スクリーンショット 2025-02-17 23 45 28" src="https://github.com/user-attachments/assets/f6117107-d0f8-463d-9f49-c4184fa2bb5d" />

10社分と指定したとき、同じ会社を選択したり、ブレインズを事例として回答してしまう。<br>
<img width="500" alt="スクリーンショット 2025-02-17 23 49 05" src="https://github.com/user-attachments/assets/60266e02-df48-4a9c-b32c-922e77ddff8a" /><br>
<img width="500" alt="スクリーンショット 2025-02-17 23 52 57" src="https://github.com/user-attachments/assets/e2a76f8b-9147-49b0-a5a5-79b279fd4b8c" />


