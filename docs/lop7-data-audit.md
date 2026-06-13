# Audit data Lớp 7

Generated at: 2026-06-09T14:43:11.509Z

## Tổng quan

- Raw lessons meta recordCount: 207
- Lessons parsed: 207
- Raw questions meta recordCount: 4955
- Questions parsed: 4955

## Theo môn

| Môn | Bài/chủ đề | Câu hỏi | Câu hỏi/bài | Dashboard |
|---|---:|---:|---:|---|
| GDCD | 20 | 400 | 20.0 | Lệch: UI 16 |
| Tiếng Anh | 12 | 480 | 40.0 | Lệch: UI 36 |
| Lịch sử & Địa lí | 30 | 600 | 20.0 | Lệch: UI 32 |
| Tin học | 22 | 440 | 20.0 | Lệch: UI 19 |
| Ngữ văn | 28 | 560 | 20.0 | Lệch: UI 24 |
| Toán | 40 | 1200 | 30.0 | Lệch: UI 38 |
| Khoa học tự nhiên | 35 | 875 | 25.0 | Lệch: UI 30 |
| Công nghệ | 20 | 400 | 20.0 | Lệch: UI 19 |

## Cảnh báo chính

### Dashboard lệch số bài

- GDCD: raw 20, UI 16
- Tiếng Anh: raw 12, UI 36
- Lịch sử & Địa lí: raw 30, UI 32
- Tin học: raw 22, UI 19
- Ngữ văn: raw 28, UI 24
- Toán: raw 40, UI 38
- Khoa học tự nhiên: raw 35, UI 30
- Công nghệ: raw 20, UI 19

### Bài không có câu hỏi

Không có.

### Bài dưới 10 câu hỏi

Không có.

### Bài thiếu summary

- Tiếng Anh / g7_eng_u01: Hobbies and Free Time
- Tiếng Anh / g7_eng_u02: Healthy Living
- Tiếng Anh / g7_eng_u03: Community Service
- Tiếng Anh / g7_eng_u04: Music and Arts
- Tiếng Anh / g7_eng_u05: Food and Drink
- Tiếng Anh / g7_eng_u06: Places in Town
- Tiếng Anh / g7_eng_u07: Traffic and Road Safety
- Tiếng Anh / g7_eng_u08: Films and Media
- Tiếng Anh / g7_eng_u09: Festivals and Celebrations
- Tiếng Anh / g7_eng_u10: Energy and the Environment
- Tiếng Anh / g7_eng_u11: Travelling and Future Transport
- Tiếng Anh / g7_eng_u12: English-speaking Countries and World Cultures

### Bài có summary quá ngắn

- Lịch sử & Địa lí / g7_his_003: Byzantine và thế giới Hồi giáo
- Lịch sử & Địa lí / g7_his_007: Việt Nam thế kỉ X: bước đầu độc lập
- Lịch sử & Địa lí / g7_his_008: Đại Việt thời Lý
- Lịch sử & Địa lí / g7_his_010: Nhà Hồ và thời kì chống Minh đầu thế kỉ XV
- Lịch sử & Địa lí / g7_his_012: Đại Việt thời Lê sơ
- Lịch sử & Địa lí / g7_geo_006: Châu Phi: tự nhiên, hoang mạc và xavan
- Lịch sử & Địa lí / g7_geo_008: Châu Mỹ: tự nhiên và các khu vực
- Lịch sử & Địa lí / g7_geo_009: Châu Mỹ: dân cư và kinh tế
- Lịch sử & Địa lí / g7_geo_011: Châu Nam Cực

### Bài có title quá ngắn

Không có.

### Textbook map

- Lessons textbookMap null: 207/207
- Questions textbookMap null: 4955/4955

### Câu hỏi thiếu đáp án/giải thích/options

- Missing correctAnswer: 0
- Missing explanation: 0
- Missing options hoặc options < 2: 0

## Gợi ý xử lý

1. Giữ nguyên raw data.
2. Sửa dashboard để lấy số bài từ data thật thay vì hard-code.
3. Bổ sung data làm dày vào `src/data/grade7/enriched/`, theo batch 5-10 bài.
4. Ưu tiên enrich Toán trước, sau đó KHTN và Tiếng Anh.
