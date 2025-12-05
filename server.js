const express = require("express");
const path = require("path"); // Cần thiết để đọc file
const fs = require("fs");   // Cần thiết để đọc file

const app = express();

// Render sử dụng biến môi trường PORT, nên dùng nó thay vì hardcode
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- CẤU HÌNH APPLE-APP-SITE-ASSOCIATION (AASA) ---

// Đường dẫn tới tệp AASA (Giả sử file có tên là apple-app-site-association.json)
const aasaFilePath = path.join(__dirname, '.well-known', 'apple-app-site-association.json');
let aasaContent = null;

try {
    // Đọc nội dung tệp AASA đồng bộ
    aasaContent = fs.readFileSync(aasaFilePath, 'utf8');
    console.log("AASA file loaded successfully.");
} catch (error) {
    console.error("Lỗi: Không tìm thấy tệp AASA (apple-app-site-association.json).", error.message);
    // Lưu ý: Mặc dù lỗi Entitlement không do AASA, server vẫn cần hoạt động.
    // Nếu tệp này không tồn tại, App Clip sẽ không kích hoạt.
    // KHÔNG process.exit(1) để giữ server chạy cho Stripe.
}

/**
 * Hàm phục vụ tệp AASA với header bắt buộc.
 */
function serveAasaFile(req, res) {
    if (!aasaContent) {
        // Trường hợp AASA không được load lúc khởi động server
        return res.status(500).json({ error: "AASA content not available." });
    }

    // BẮT BUỘC: Content-Type phải là application/json
    res.setHeader('Content-Type', 'application/json');
    // Ngăn cache để iOS luôn lấy cấu hình mới nhất
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Gửi nội dung JSON
    res.send(aasaContent);
}

// 1. Endpoint theo đường dẫn .well-known (Ưu tiên)
app.get('/.well-known/apple-app-site-association', serveAasaFile);

// 2. Endpoint theo đường dẫn gốc (Thay thế)
app.get('/apple-app-site-association', serveAasaFile);


// --- CẤU HÌNH STRIPE PAYMENT ---

// Thay đổi giá trị này thành khóa bí mật API của bạn (Nên dùng process.env.STRIPE_SECRET_KEY)
const stripe = require("stripe")("sk_test_51MpNF2KkURD5t8wjINNC64H1D8KbEzTzKob7fgizoZeaGbGX3elUrwTWvsZKctZoIU7NWbO9QlWjYUdgNzuGjULC00ErVWX1Ws");

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      payment_method_types: ["card"],
      description: req.body.description,
      payment_method_data : {
        type: "card",
        card: {
            token: req.body.token
        }
      }
    });
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create PaymentIntent" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
