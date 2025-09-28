#!/bin/bash
echo "Testing Netlify Function..."

# Thay YOUR_NETLIFY_URL bằng URL thực tế
URL="https://tubular-arithmetic-594a38/netlify/functions/analyze-mindmap"

curl -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sơ đồ tư duy là công cụ trực quan giúp tổ chức thông tin. Nó bắt đầu từ ý tưởng trung tâm, sau đó phát triển các nhánh ý tưởng phụ."
  }' \
  -v
