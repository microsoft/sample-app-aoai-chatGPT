# LLMのパラメータによる回答内容の変化
- 背景
  - LLMの回答内容に対するパラメータ変更の影響を調査しました。
  - 変更したパラメータは以下2つです。
    - AZURE_OPENAI_TEMPERATURE（以降TEMPERATURE）
      - 生成テキストのランダム性・多様性の制御パラメータ。Azureのデフォルト値は0.7。0~2で調整し、値が小さいほどランダム性が小さくなる。
    - AZURE_OPENAI_TOP_P（以降TOP_P）
        - 出力の幅や創造性を調整するパラメータ。Azureのデフォルト値は0.95。0~1で調整し、値が小さいほど出力幅が狭くなる。
  - [todo] 余力があればトークン生成の解説
- 実験内容
  -概要
    - TEMPERATURE, TOP_Pともに0を基準とし、パラメータのパターンを変更しながら2回づつ同じ質問を行い、回答内容の変化と再現性を確認しました。
  -パラメータパターン
    - TEMPERATURE=0のとき
    　　- TOP_P = 0, 0.2, 0.5, 0.7, 1.0, 1.2, 1.5
    - TOP_Pのとき
      - TEMPERATURE = 0, 0.2, 0.5, 0.7, 0.95, 1.0
  - 質問文
　　  -   Neuronが競合と比べて選ばれる理由を3つ教えてください
  - 期待する回答
　　  - 検索にヒットしたファイルから必要な情報をまとめられる
- 結果・考察
  - [結果一覧はこちら](https://docs.google.com/spreadsheets/d/1LjRzi9FyqdQk4g7WxtzFOkEurJ3RssDoZNCg97mQdBs/edit?gid=0#gid=0)
  - 


[mainに戻る](https://github.com/brains-technology/sample-app-aoai-chatGPT/blob/branch-1/research/research_main.md)
