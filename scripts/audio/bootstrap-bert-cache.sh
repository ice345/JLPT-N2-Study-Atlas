#!/usr/bin/env bash
set -euo pipefail

endpoint="https://huggingface.co"
if [[ "${1:-}" == "--endpoint" ]]; then
  endpoint="${2:?--endpoint requires a URL}"
fi

data_dir="${AIVIS_DATA_DIR:-${HOME}/.local/share/AivisSpeech-Engine}"
repository="tsukumijima/deberta-v2-large-japanese-char-wwm-onnx"
revision="d701ec67708287b20d2063270f6b535e6eed09ab"
cache_name="models--tsukumijima--deberta-v2-large-japanese-char-wwm-onnx"
snapshot_dir="${data_dir}/BertModelCaches/${cache_name}/snapshots/${revision}"
expected_model_sha256="23f633ae7c5900ff82b35a428b67a54e7e7911d5d6a6dcfc77967be8f1c94dc6"
files=(config.json model_fp16.onnx special_tokens_map.json tokenizer.json tokenizer_config.json vocab.txt)

mkdir -p "${snapshot_dir}"

for filename in "${files[@]}"; do
  target="${snapshot_dir}/${filename}"
  partial="${target}.partial"
  if [[ -s "${target}" ]]; then
    echo "skip ${filename}: already cached"
    continue
  fi
  echo "download ${filename}"
  curl \
    --fail \
    --location \
    --retry 8 \
    --retry-all-errors \
    --continue-at - \
    --output "${partial}" \
    "${endpoint%/}/${repository}/resolve/${revision}/${filename}"
  mv "${partial}" "${target}"
done

actual_model_sha256="$(shasum -a 256 "${snapshot_dir}/model_fp16.onnx" | awk '{print $1}')"
if [[ "${actual_model_sha256}" != "${expected_model_sha256}" ]]; then
  echo "BERT model checksum mismatch: expected ${expected_model_sha256}, got ${actual_model_sha256}" >&2
  exit 1
fi

echo "BERT snapshot cached and verified at ${snapshot_dir}."
echo "Start with AIVIS_HF_HUB_OFFLINE=1 npm run audio:engine:up to bypass blocked Hugging Face metadata requests."
