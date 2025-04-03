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
    <td valign="top"><b>月額 $98.95 = 15,337円/月</b>（155円/ドル）<br>価格レベルbasic<br>26ファイルを最大チャンク長512, オーバーラップ128でベクトル化し、検索インデックス内ドキュメント数227、ストレージ合計9.57MB使用。</td>
    <td valign="top">夜間や休日に停止できない月額固定費。<br>利用人数は関係ない。ストレージの容量が増えると価格レベルを上げる必要があるので、ファイル数で価格が決まると言える。</td>
  </tr>
  <tr>
    <td valign="top">Webアプリ</td>
    <td valign="top">App Service</td>
    <td valign="top"><b>月額 $13.87 = 2,150円/月</b><br>Basic B1, 1vCPU, 1.75GBメモリ</td>
    <td valign="top">夜間や休日に停止できない月額固定費。利用人数や利用頻度によってアップグレード。</td>
  </tr>
  <tr>
    <td valign="top">LLM・ベクトル化</td>
    <td valign="top">OpenAI Service</td>
    <td valign="top"><b>gpt-4o利用の場合、1回の質問と回答で約7円</b>（Embeddingモデル利用料含む）<br>LLMの利用料「7円/回×4回/人/日×5人×20日/月=2,800円」と試算。<br></td>
    <td valign="top">約7円の内訳<br>gpt 4o 0513 Input global 6.76円/回<br>gpt 4o 0513 Output global	0.60円/回</td>
  </tr>
    <tr>
    <td valign="top">合計コスト</td>
    <td valign="top">上記以外に<br>- Blob Storage（事例ファイルを保存）<br>- Cosmos DB（会話履歴の保存）<br>- Synapse Analysis（会話履歴の抽出）<br>を利用。</td>
    <td valign="top"><b>月額約30,800円。</b><br>15,337円+2,150円+2,800円=20,287円<br>Blob Storage：月額2~3円<br>Cosmos DB：月額6~9円<br>Synapse Analysis：2000円〜3000円<br>Defender:月額~7500円</td>
    <td valign="top">AI Searchが合計コストの約50%を占める。<br>自動で追加されるMicrosoft Defender for Cloudが毎日240円程かかっており、月額~7500円になるのが気になる。</td>
  </tr>
</table>

チャットボットで使っているリソースグループのある月の1ヶ月の料金を例として示します。
<img width="1379" alt="チャットボットの2025年3月の料金" src="https://github.com/user-attachments/assets/014f9af1-7037-4897-8607-e8c6c3d2fb9c" />

要点
- Azure AI Searchが約50%を占めている。対象ファイル数で価格が決まる月額固定費。3/1に価格レベルS1からBasicに変更。
- Webサーバーの部分はユーザーが増えるときに段階的に料金が増えることになる。仮想サーバーのように夜間や土日に停止することができない。価格に占める割合は全体の10%以下で、月額固定費。3/26と3/27にチャットボットを増やしたため、68円/日が136円//日になった。<br>
- 会話履歴を確認するためにCosmosDBからデータ取得すると、Synapse Analyticsの料金がかかる。4列×10行〜20行で、250円/回〜500円/回。
- Microsoft Defenderが8390円かかってる。全体の約25%。
- Azureでチャットボットを構築すると、ユーザー課金になる要素は極めて少ない。
