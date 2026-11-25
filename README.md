# English Trans Speak

Chrome extension: **dịch đoạn tiếng Anh bằng Azure Translator** và **đọc bằng Web Speech API**.

Repo: https://github.com/pham-duy-hung/English_trans_speak

## Tính năng

- Dịch EN → VI qua Azure Cognitive Services Translator
- Đọc đoạn tiếng Anh bằng Web Speech API (giọng hệ thống Chrome)
- Lấy text đang bôi đen trên trang
- Context menu: *English Trans Speak: lấy đoạn này*
- Lưu Azure key/region trong `chrome.storage.sync`

## Cài đặt (developer mode)

1. Mở `chrome://extensions`
2. Bật **Developer mode**
3. **Load unpacked** → chọn thư mục project này
4. Vào Options của extension, nhập Azure Key + Region
5. Bấm **Test dịch** để kiểm tra

## Azure Translator (free tier)

1. Azure Portal → tạo resource **Translator** (F0)
2. Copy **Key 1** và **Location/Region** (vd. `eastasia`)
3. Dán vào trang Options của extension

Quota F0 khoảng **2 triệu ký tự / tháng**.

> Không commit key lên GitHub. Key chỉ lưu local trong Chrome storage.

## Dùng nhanh

1. Bôi đen đoạn tiếng Anh trên web
2. Mở popup extension → **Lấy text đang chọn** (hoặc dùng context menu)
3. **Dịch (Azure)** / **Đọc EN** / **Dịch + Đọc**

## Cấu trúc

```
manifest.json
popup/          # UI chính
options/        # cấu hình Azure
background/     # context menu
lib/azure.js    # Azure Translator client
lib/tts.js      # Web Speech API
icons/
```

## Phát triển

```bash
git clone https://github.com/pham-duy-hung/English_trans_speak.git
cd English_trans_speak
```

Sau khi sửa code: `chrome://extensions` → nút Reload trên extension.

## Đóng gói gửi bạn bè (dùng chung Azure key của bạn)

1. **Rotate key** nếu từng gửi key qua chat / public
2. Copy `pack-secrets.example.json` → `pack-secrets.json`, dán Key + Region
3. Chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pack.ps1
```

4. Lấy file `dist\English_trans_speak.zip` — gửi **riêng tư** (Zalo/Drive hạn chế)
5. Bạn bè làm theo `INSTALL-FRIENDS.md` (Load unpacked)

`pack-secrets.json` đã nằm trong `.gitignore` — **không** commit / push key lên GitHub.

### Rủi ro khi share key

- Ai có zip đều dùng được quota Translator của bạn
- Hết Free F0 (~2M ký tự/tháng) thì cả nhóm cùng bị chặn
- Không đăng zip lên group công khai / GitHub Release public
