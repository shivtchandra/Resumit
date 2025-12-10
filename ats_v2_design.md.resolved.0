# ATS Emulator + Resume Optimizer V2 Design Document

## 1. Global Architecture Overview

The V2 architecture moves from a purely rule-based system to a hybrid pipeline where a shared ingestion and feature extraction layer feeds into three distinct ML/AI modules.

### High-Level Pipeline

```mermaid
graph TD
    User[User Uploads Resume + JD] --> Ingestion[Ingestion Layer]
    Ingestion --> Parsing{Parsing Router}
    
    subgraph "Shared Components"
        Parsing -- PDF --> PDFParser[PDF Stream & Z-Order Analyzer]
        Parsing -- DOCX --> XMLParser[DOCX XML Parser]
        Parsing -- Image --> OCR[OCR Engine (Tesseract/DocTR)]
        
        PDFParser --> RawText
        XMLParser --> RawText
        OCR --> RawText
        
        RawText --> FeatureExtraction[Feature Extraction Engine]
        FeatureExtraction --> VectorDB[(Vector Store)]
        FeatureExtraction --> StructDB[(Structured Data Store)]
    end
    
    subgraph "Mode 1: ATS Friendliness"
        StructDB --> FriendlinessModel[Friendliness Classifier (XGBoost)]
        FriendlinessModel --> RiskScore[Risk Score (0-100)]
        FriendlinessModel --> RiskFactors[Risk Factors List]
    end
    
    subgraph "Mode 2: Visibility Ranker"
        StructDB --> RankerFeatures
        VectorDB --> RankerFeatures
        RankerFeatures --> LTRModel[Learning-to-Rank Model]
        LTRModel --> VisibilityScore[Visibility Probability / Rank]
    end
    
    subgraph "Mode 3: Rewrite Assistant"
        RawText --> LLMContext
        JD[Job Description] --> LLMContext
        RiskFactors --> LLMContext
        LLMContext --> RewriteModel[LLM (Fine-tuned/Prompted)]
        RewriteModel --> OptimizedResume[Optimized Resume Markdown/JSON]
    end
    
    RiskScore --> UI
    VisibilityScore --> UI
    OptimizedResume --> UI
```

### Integration with V1
The existing V1 heuristic engine will serve as a **fallback and feature generator**. 
- **Heuristic Features**: V1's rule violations (e.g., "missing email") become input features for the V2 ML models.
- **Cold Start**: Until sufficient user feedback data is collected, V1's logic will define the "Ground Truth" for the initial training of the Friendliness Classifier (e.g., if V1 flags a table, the label is "Risk").

---

## 2. Shared Components

The core of the system is the **Ingestion & Feature Extraction** layer. This layer must replicate the "failure modes" described in the whitepaper to accurately predict ATS behavior.

### 2.1 Parsing & Ingestion Layer
This layer mimics how different vendors (Workday, Taleo, etc.) see the file.

- **PDF Parsing (The Z-Order Check)**:
  - Use `pdfminer.six` or `PyMuPDF` to extract text.
  - **Critical Feature**: Extract text *twice*—once in visual order (XY cut) and once in raw stream order. Calculate the **Levenshtein distance** between these two streams. A high distance indicates **Z-Order Fragmentation**, a major risk factor.
- **DOCX Parsing (XML Hierarchy)**:
  - Use `python-docx` to traverse the XML tree.
  - **Floating Object Detection**: Flag any content inside `<w:textBox>` or strictly in `<w:headerReference>`/`<w:footerReference>` tags, as legacy parsers (Taleo) often ignore these.
- **OCR Trigger**:
  - If text extraction yields < 50 characters but file size > 50KB, trigger OCR (Tesseract/EasyOCR). Flag as **"Image-Based PDF"** (High Risk).

### 2.2 Section Segmentation
- Implement a heuristic segmenter looking for standard anchors ("Experience", "Education", "Skills").
- **Feature**: `standard_section_ratio`. If the resume uses "Professional Odyssey" instead of "Experience", this ratio drops, signaling a parsing risk.

### 2.3 Feature Extraction
These features feed both the Friendliness Classifier and the Visibility Ranker.

| Feature Category | Specific Features | Whitepaper Reference |
|------------------|-------------------|----------------------|
| **Structural** | `has_tables`, `has_columns`, `file_size_mb`, `is_image_based`, `z_order_diff_score`, `floating_object_count` | 1.2, 1.3 (Tables, Z-Order) |
| **Content** | `word_count`, `page_count`, `standard_section_count`, `date_continuity_score` (gaps), `contact_info_in_header` | 1.2.2, 3.2 (Gaps) |
| **IR / Scoring** | `bm25_score_vs_jd`, `exact_keyword_match_count`, `boolean_query_coverage` | 2.1, 2.3 (BM25) |
| **Semantic** | `cosine_similarity_sbert`, `entity_overlap_score` (NER) | 2.4 (Vector Space) |
| **Vendor Specific** | `workday_title_map_risk` (non-standard titles), `taleo_format_risk` (complex formatting) | 4.1, 4.2 |

---

## 3. Mode 1: ATS Friendliness Classifier

**Goal**: Predict the probability that an ATS will fail to parse or correctly structure the resume.

### 3.1 Target Label & Training
- **Target**: `parsing_success_score` (0-100).
- **Heuristic Labeling (Bootstrap)**:
  - Create a synthetic dataset of 10,000 resumes.
  - Run them through open-source parsers (Sovren trial, or robust open-source alternatives like `pyresparser` vs simple text extraction).
  - **Label = 1 (Pass)** if: Extracted Name/Email/Skills match Ground Truth AND Section separation is correct.
  - **Label = 0 (Fail)** if: Fields missing, text jumbled (high Z-order diff), or empty output.
- **Production Labeling**: User feedback ("The ATS didn't auto-fill my info").

### 3.2 Model Architecture
- **Model**: Gradient Boosting Classifier (XGBoost or LightGBM).
- **Why**: Handles tabular data, non-linear relationships, and provides feature importance (explainability).
- **Input**: Structural features defined in Section 2.3.

### 3.3 Scoring & Output
- **Raw Output**: Probability $P(fail)$.
- **Score**: $100 * (1 - P(fail))$.
- **Risk Categories**:
  - **High Risk (0-50)**: "Critical Parsing Failure Likely" (e.g., Image PDF, Broken Z-Order).
  - **Moderate Risk (51-80)**: "Content May Be Lost" (e.g., Tables, Headers).
  - **ATS Friendly (81-100)**: "Safe Structure".

### 3.4 Example JSON Output
```json
{
  "score": 72,
  "risk_level": "Moderate",
  "issues": [
    {
      "type": "structural",
      "severity": "high",
      "message": "Detected multi-column layout with potential Z-order fragmentation.",
      "whitepaper_ref": "1.2.1"
    },
    {
      "type": "parsing",
      "severity": "medium",
      "message": "Contact info found in Header. Some legacy parsers (Taleo) may miss this.",
      "whitepaper_ref": "1.2.2"
    }
  ]
}
```

---

## 4. Mode 2: Visibility Ranker

**Goal**: Estimate the likelihood of appearing on "Page 1" of search results for a specific JD.

### 4.1 Problem Formulation: Learning-to-Rank
- **Type**: Pointwise or Pairwise Ranking.
- **Training Data**:
  - **Input**: Pair (Resume, JD).
  - **Target**: `relevance_score` (0-5).
  - **Synthetic Labels**: Generate scores using a weighted formula derived from the whitepaper:
    $$ Score = 0.4 \times BM25 + 0.3 \times Semantic + 0.2 \times BooleanMatch - 0.5 \times (ParsingRisk) $$
    This bootstraps the model to learn the *mechanics* of ATS ranking described in the paper (e.g., penalizing length due to BM25 normalization).

### 4.2 Features
- **BM25 Score**: Calculated using `rank_bm25` library.
- **Boolean Coverage**: Check for "Must Have" keywords from JD (e.g., "Python", "Agile").
- **Semantic Similarity**: Cosine similarity of `all-MiniLM-L6-v2` embeddings of Resume vs JD.
- **Keyword Density**: Term frequency of top JD keywords (detect stuffing vs natural usage).
- **Negative Filters**:
  - `gap_flag`: >6 month gap detected (Whitepaper 3.2).
  - `radius_mismatch`: If location provided, distance > 50 miles.

### 4.3 Model Approach
- **Model**: `LGBMRanker` (LightGBM) or a simple Feed-Forward Neural Network.
- **Output**: A raw score. Normalize this against a distribution of "average" resumes to give a percentile.

### 4.4 Fairness & Bias
- **Constraint**: Explicitly exclude Name, Gender, University Name, and Address (zip code only for radius) from the feature set.
- **Audit**: Periodically check if "Tier 1" universities (if used for feature extraction) correlate with protected groups.

---

## 5. Mode 3: Rewrite Assistant

**Goal**: Transform a "High Risk" resume into an "ATS Optimized" version without hallucination.

### 5.1 Architecture
- **Level 1 (Initial)**: Prompt Engineering with GPT-4o/Claude 3.5 Sonnet.
- **Level 2 (Future)**: Fine-tuned Llama 3 (8B) on (Bad Resume, Good Resume) pairs.

### 5.2 System Prompt Strategy (Grounded in Whitepaper)
The prompt must strictly enforce the "Technical Compatibility" rules from Section 7 of the whitepaper.

**Prompt Instructions**:
1.  **Structure**: Enforce a single-column, linear layout. Move headers/footers to body.
2.  **Standardization**: Rename "Professional Odyssey" to "Work Experience".
3.  **Keyword Optimization**:
    - Identify "Must Have" keywords in JD.
    - *Rewrite* existing bullet points to include these keywords naturally (e.g., change "Ran daily meetings" to "Led daily **Scrum** standups").
    - **Constraint**: Do NOT add skills not present in the original text (No Hallucination).
4.  **Formatting**: Remove tables. Fix "Java | Python" to "Java, Python" (Taleo fix).
5.  **Adversarial Check**: Remove hidden white text.

### 5.3 Data & Fine-Tuning
- **Dataset Creation**:
  - Take 1,000 public resumes.
  - Corrupt them (add tables, weird headers, synonyms instead of keywords).
  - Use the original clean resume as the "Target".
  - Fine-tune the model to map Corrupt -> Clean.

### 5.4 Output Format
- **Markdown**: Clean, simple markdown that renders well to PDF/DOCX.
- **Diff View**: UI highlights changes (e.g., "Renamed section", "Added 'Agile' to context").

---

## 6. UI & API Design

### 6.1 API Endpoints (FastAPI)

#### `POST /analyze/ats_friendliness`
- **Input**: `MultipartFile` (resume), `vendor_hint` (optional).
- **Output**: `FriendlinessResponse` (Score, Risks).

#### `POST /analyze/visibility_rank`
- **Input**: `resume_id`, `job_description_text`.
- **Output**: `RankResponse` (Percentile, MissingKeywords, BooleanGaps).

#### `POST /rewrite/ats_optimized`
- **Input**: `resume_id`, `job_description_text`.
- **Output**: `RewriteResponse` (MarkdownContent, ChangeLog).

### 6.2 UI Layout (React)

**Tab 1: ATS Friendliness (The Gatekeeper)**
- **Hero**: Speedometer gauge (0-100).
- **Visualizer**: "How the Robot Sees You" - display the raw extracted text stream side-by-side with the PDF to show Z-order scrambling.
- **Alerts**: Red flags for "Tables Detected", "Header Contact Info".

**Tab 2: Visibility (The Recruiter)**
- **Hero**: "Page 1 Probability".
- **Keyword Gap Analysis**: Venn diagram of Resume vs JD keywords.
- **Filter Check**: "Did you pass the Knockout Questions?" (Simulated).

**Tab 3: Optimizer (The Fix)**
- **Split View**: Original (Left) vs Optimized (Right).
- **Diff Highlights**: Green highlights for added keywords, Red strikethrough for removed fluff.
- **Action**: "Export to DOCX".

---

## 7. Data & Training Pipeline

### 7.1 Data Model
- **Resumes Table**: `id`, `raw_file_path`, `parsed_text`, `features_json`.
- **Jobs Table**: `id`, `text`, `keywords_extracted`.
- **Analyses Table**: `resume_id`, `job_id`, `friendliness_score`, `rank_score`.
- **Outcomes Table**: `analysis_id`, `user_feedback` (Interview/Reject), `actual_ats_result`.

### 7.2 Training Loop
1.  **Collection**: Log every analysis request.
2.  **Feedback**: Prompt user 2 weeks later: "Did you get an interview?"
3.  **Retraining**:
    - **Friendliness**: If user says "ATS failed to read my name", add to "Fail" class.
    - **Ranker**: If user says "Got interview", increase weight of this Resume-JD pair in LTR model.
4.  **Evaluation**:
    - **Offline**: NDCG on held-out set of "Successful" resumes.
    - **Online**: A/B test different scoring weights to see which correlates best with user success.

### 7.3 Deployment
- **Containerization**: Dockerize the API.
- **Model Serving**: ONNX Runtime for XGBoost/LightGBM models for low latency.
- **LLM**: Call external API (OpenAI/Anthropic) initially; move to self-hosted vLLM for Llama 3 when scale justifies cost.
