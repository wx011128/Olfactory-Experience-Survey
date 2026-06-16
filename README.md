# Olfactory Experience Survey

Claude Monet《睡蓮》を対象に、4種類の香り A〜D を比較するための第二段階実験フォームです。

## Pages

- `/`：実験フォーム
- `/evaluation.html`：評価体系の説明
- `/admin.html`：回答データ確認
- `/api/responses.csv`：CSVダウンロード

## Vercel

このフォルダは Vercel にそのままアップロードできます。

```text
index.html
admin.html
evaluation.html
api/
assets/
```

## Data storage

回答データは Vercel Blob に保存します。
Vercel 側で Blob Storage をプロジェクトに追加すると、`BLOB_READ_WRITE_TOKEN` が自動的に設定されます。

Blob Storage が設定されていない場合、API はローカル開発用の一時保存にフォールバックします。
公開アンケートとして長期的に回答を保存する場合は、必ず Vercel Blob を接続してください。

## Vercel settings

- Framework Preset: Other
- Root Directory: repository root
- Build Command: empty
- Output Directory: empty
