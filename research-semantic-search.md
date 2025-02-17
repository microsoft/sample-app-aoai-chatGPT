### Azure OpenAI On Your Data
セマンティック検索に関する記述<br>
https://learn.microsoft.com/ja-jp/azure/ai-services/openai/concepts/use-your-data?tabs=ai-search%2Ccopilot#runtime-parameters

### Azure AI Search でのセマンティック ランク付け
https://learn.microsoft.com/ja-jp/azure/search/semantic-search-overview<br>
#### 取得するドキュメントの数を変更したい時

取得したドキュメント<br>
このパラメーターは、3、5、10、または 20 に設定できる整数であり、最終的な応答を作成するために大規模言語モデルに提供されるドキュメント チャンクの数を制御します。既定では、5 に設定されます。<br>
チャット　プレイグラウンドで設定可能<br>
<img width="502" alt="スクリーンショット 2025-02-17 23 21 37" src="https://github.com/user-attachments/assets/dcb05f3f-c667-4a3c-8dc9-3754fc5fb9ee" />

環境変数'AZURE_SEARCH_TOP_K'でも確認可能<br>
<img width="1011" alt="スクリーンショット 2025-02-17 23 38 21" src="https://github.com/user-attachments/assets/60880606-b48c-4e27-9ede-352bf7b60839" />
