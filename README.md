# Enterprise PDF → Searchable Knowledge Platform

A next-generation pipeline that transforms unstructured enterprise PDFs into structured, searchable knowledge assets. The solution operationalizes OCR, table extraction, layout understanding, and vector search to enable rapid information discovery across large document repositories.

---

## 🚀 Core Value Proposition

Enterprises maintain thousands of policy documents, manuals, contracts, and reports. These PDFs are rich in content but difficult to query due to unstructured formatting.

This platform delivers an intelligent ingestion engine that converts PDFs into:

- searchable text units  
- structured tables  
- annotated images and charts  
- vectorized semantic knowledge  

---

## 🧭 Functional Overview

The tool is designed to:

- process native and scanned PDFs using OCR  
- respect table of contents and logical layout  
- segment documents into meaningful chapters/sections  
- extract and structure tabular data  
- annotate images and charts with captions  
- store text into a **Vector Database** for semantic search  
- store tables into **NoSQL storage** for precise queries  

---

## 🛠️ High-Level Architecture

**Pipeline Flow**

1. PDF upload  
2. Page extraction + OCR for scanned pages  
3. TOC & logical segmentation  
4. Section-aware text chunking  
5. Table detection and extraction  
6. Image/chart detection and captioning  
7. Text embedding generation  
8. Data persistence into
   - Vector DB (text)
   - NoSQL DB (tables)
9. Interactive search UI for retrieval

---

## 🧰 Technology Stack

| Layer | Technology |
|------|-----------|
Frontend UI | React + Tailwind + Vite
OCR | Tesseract / Google Vision
PDF Parsing | pdf.js / pdfplumber
Embeddings | Gemini / OpenAI
Vector DB | FAISS / Chroma / Pinecone
NoSQL DB | MongoDB / DynamoDB
Backend | Node.js / FastAPI
Search | Hybrid semantic + keyword

---

## ✔ Deliverables

- Working ingestion pipeline  
- Structured JSON knowledge output  
- Integrated semantic search interface  
- OCR support for scanned PDFs  
- Table extraction and storage layer  
- Image and chart captioning  

---

## 🧪 Stretch Goals

- multilingual document processing  
- handwritten text handling  
- low-quality image enhancement  
- complex chart data extraction  

---

## 🚦 Getting Started

### 1️⃣ Install dependencies
1️⃣ Install dependencies
npm install

2️⃣ Configure environment variables
Create a file named:
.env.local

Add:
VITE_GEMINI_API_KEY=your_api_key_here

3️⃣ Run the development server
npm run dev

4️⃣ Open the application in browser
http://localhost:5173

5️⃣ Build for production (optional)
npm run build

6️⃣ Preview production build (optional)
npm run preview

