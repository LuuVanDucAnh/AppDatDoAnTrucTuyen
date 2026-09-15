import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/database";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API kiểm tra Backend
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Food Delivery Backend đang hoạt động!",
    });
});

// API kiểm tra kết nối MySQL
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "Kết nối MySQL thành công!",
            data: rows,
        });
    } catch (error) {
        console.error("Lỗi kết nối MySQL:", error);

        res.status(500).json({
            success: false,
            message: "Kết nối MySQL thất bại!",
        });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});