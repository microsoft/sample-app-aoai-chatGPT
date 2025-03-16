## チャットボットの料金の分析

<table border="0">
  <tr>
    <th width="180">項目</th>
    <th width="250">利用サービス</th>
    <th width="450">コスト</th>
    <th width="300">考察</th>
  </tr>
  <tr>
    <td valign="top">ベクトルデータベース・検索</td>
    <td valign="top">AI Search</td>
    <td valign="top">Japan East <b>月額 $98.95 = 15,337円/月</b>（155円/ドル）<br>価格レベルbasic (15 GB/パーティション、最大 3 個のレプリカ、最大 3 個のパーティション、最大 9 個の検索ユニット)<br>
26ファイルを最大チャンク長512, オーバーラップ128でベクトル化し、検索インデックス内ドキュメント数227、ストレージ合計9.57MB使用。
</td>
    <td valign="top">夜間や休日に停止できない月額固定費。<br>利用人数は関係ない。</td>
  </tr>
  <tr>
    <td valign="top">Webアプリ</td>
    <td valign="top">App Service</td>
    <td valign="top">Japan East <b>月額 $13.87 = 2,150円/月</b><br>Basic B1, 1vCPU, 1.75GBメモリ</td>
    <td valign="top">夜間や休日に停止できない月額固定費。利用人数や利用頻度によってアップグレード。</td>
  </tr>
  <tr>
    <td valign="top">LLM・ベクトル化</td>
    <td valign="top">OpenAI Service</td>
    <td valign="top"><b>gpt-4o利用の場合、1回の質問と回答で約15円</b>（Embeddingモデル利用料含む）。</td>
    <td valign="top">約15円の内訳は、Inputに13円〜14円かかっている。</td>
  </tr>
    <tr>
    <td valign="top">合計コスト</td>
    <td valign="top">上記以外に<br>- Blob Storage（事例ファイルを保存）<br>- Cosmos DB（会話履歴の保存）<br>- Synapse Analysis（会話履歴の抽出）<br>を利用。</td>
    <td valign="top"><b>月額約22,000円。</b><br>LLMの利用料「15円/回×3回/人/日×5人×20日/月=4,500円」と試算。<br>Blob Storage：月額2~3円<br>Cosmos DB：月額6~9円<br>Synapse Analysis：2000円〜3000円</td>
    <td valign="top">AI Searchが合計コストの70%前後を占める。<br>左記以外に、自動で追加されるMicrosoft Defender for Cloudが毎日240円程かかっており、月額7200円になるのが気になる。</td>
  </tr>
</table>
