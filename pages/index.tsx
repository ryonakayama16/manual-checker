import { useState, useCallback, useRef } from "react";
import Head from "next/head";
import { CRITERIA, TOTAL_POINTS, getScoreLabel } from "../lib/criteria";

type DiagnosisResult = {
  scores: Record<string, number>;
  feedback: Record<string, string>;
  overall_comment: string;
  strengths: string[];
  improvements: string[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      if (dropped.size > 10 * 1024 * 1024) {
        setError("10MB以下のPDFをアップロードしてください");
        return;
      }
      setFile(dropped);
      setResult(null);
      setError("");
    } else {
      setError("PDFファイルのみアップロード可能です");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError("");
    }
  };

  const handleDiagnose = async () => {
    if (!file) return;
    setIsLoading(true);
    setError("");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 800);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/diagnose", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok || !data.success) {
        setError(data.error || "診断に失敗しました");
      } else {
        setResult(data.result);
      }
    } catch (e) {
      clearInterval(progressInterval);
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // スコア計算
  const calculateScores = () => {
    if (!result) return null;
    let totalGot = 0;
    const categoryScores = CRITERIA.map((cat) => {
      let catGot = 0;
      let catMax = 0;
      cat.items.forEach((item) => {
        const score = result.scores[item.id] ?? 0;
        catGot += score;
        catMax += item.points;
        totalGot += score;
      });
      return {
        ...cat,
        got: catGot,
        max: catMax,
        pct: Math.round((catGot / catMax) * 100),
      };
    });
    const totalPct = Math.round((totalGot / TOTAL_POINTS) * 100);
    return { categoryScores, totalGot, totalPct };
  };

  const scores = result ? calculateScores() : null;
  const scoreLabel = scores ? getScoreLabel(scores.totalPct) : null;

  return (
    <>
      <Head>
        <title>業務マニュアル品質診断 | 株式会社2.1</title>
        <meta
          name="description"
          content="業務マニュアルの品質をAIが診断。視認性・可読性・判読性など6つの基準で評価します。"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        :root {
          --navy: #0d1b35;
          --blue: #1a4fa0;
          --accent: #e8a020;
          --light: #f4f7fb;
          --white: #ffffff;
          --gray: #6b7280;
          --border: #dde3ed;
        }
        body {
          font-family: "Noto Sans JP", sans-serif;
          background: var(--light);
          color: var(--navy);
          min-height: 100vh;
        }

        /* ヘッダー */
        .header {
          background: var(--navy);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-badge {
          background: var(--accent);
          color: var(--navy);
          font-weight: 900;
          font-size: 0.75rem;
          padding: 3px 10px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .header-title {
          color: var(--white);
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.05em;
        }
        .header-sub {
          color: #8899bb;
          font-size: 0.75rem;
        }

        /* ヒーロー */
        .hero {
          background: linear-gradient(135deg, var(--navy) 0%, #1a3a7a 100%);
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            ellipse at center,
            rgba(26, 79, 160, 0.3) 0%,
            transparent 60%
          );
          pointer-events: none;
        }
        .hero-tag {
          display: inline-block;
          background: rgba(232, 160, 32, 0.15);
          border: 1px solid var(--accent);
          color: var(--accent);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 16px;
          border-radius: 20px;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
        }
        .hero h1 {
          font-size: clamp(1.8rem, 4vw, 3rem);
          color: var(--white);
          font-weight: 900;
          line-height: 1.3;
          margin-bottom: 1rem;
        }
        .hero h1 span {
          color: var(--accent);
        }
        .hero p {
          color: #a0b4cc;
          font-size: 0.95rem;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.8;
        }

        /* メインコンテンツ */
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        /* アップロードカード */
        .upload-card {
          background: var(--white);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 24px rgba(13, 27, 53, 0.08);
          margin-bottom: 2rem;
        }
        .upload-card h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .upload-card h2::before {
          content: "01";
          background: var(--blue);
          color: white;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: "Bebas Neue", sans-serif;
          letter-spacing: 0.05em;
        }

        .dropzone {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--light);
        }
        .dropzone:hover,
        .dropzone.active {
          border-color: var(--blue);
          background: rgba(26, 79, 160, 0.04);
        }
        .dropzone.has-file {
          border-color: #2a9d5c;
          background: rgba(42, 157, 92, 0.04);
        }
        .dropzone-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .dropzone p {
          color: var(--gray);
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .dropzone .file-name {
          font-weight: 700;
          color: var(--navy);
          font-size: 1rem;
          margin-top: 0.5rem;
        }
        .btn-select {
          display: inline-block;
          margin-top: 1rem;
          background: var(--blue);
          color: white;
          padding: 8px 24px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }
        .btn-select:hover {
          background: #1540a0;
        }

        /* 診断ボタン */
        .btn-diagnose {
          width: 100%;
          background: linear-gradient(135deg, var(--blue) 0%, #1a3a80 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1.1rem;
          font-size: 1.05rem;
          font-weight: 700;
          font-family: "Noto Sans JP", sans-serif;
          cursor: pointer;
          margin-top: 1.5rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.05em;
        }
        .btn-diagnose:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(26, 79, 160, 0.4);
        }
        .btn-diagnose:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* プログレス */
        .progress-wrap {
          margin-top: 1.5rem;
          text-align: center;
        }
        .progress-bar-bg {
          background: var(--border);
          border-radius: 99px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--blue), var(--accent));
          border-radius: 99px;
          transition: width 0.5s ease;
        }
        .progress-text {
          color: var(--gray);
          font-size: 0.85rem;
        }

        /* エラー */
        .error-box {
          background: #fff3f3;
          border: 1px solid #f44336;
          border-radius: 8px;
          padding: 1rem 1.2rem;
          color: #c62828;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        /* 結果 */
        .result-section {
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* スコアカード */
        .score-card {
          background: var(--navy);
          border-radius: 16px;
          padding: 2.5rem;
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }
        .score-card::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(232,160,32,0.15), transparent);
          border-radius: 50%;
        }
        .score-rank {
          font-family: "Bebas Neue", sans-serif;
          font-size: 8rem;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .score-pct {
          color: rgba(255,255,255,0.7);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .score-message {
          color: rgba(255,255,255,0.85);
          font-size: 0.9rem;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* カテゴリカード */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .category-card {
          background: var(--white);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 12px rgba(13,27,53,0.06);
        }
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .category-name {
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .category-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .category-score {
          font-weight: 900;
          font-size: 1.1rem;
        }
        .category-bar-bg {
          background: var(--light);
          border-radius: 99px;
          height: 6px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .category-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 1s ease;
        }
        .item-list {
          list-style: none;
        }
        .item-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 0.5rem 0;
          border-top: 1px solid var(--border);
          font-size: 0.82rem;
        }
        .item-score-badge {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          color: white;
        }
        .item-content {
          flex: 1;
        }
        .item-text {
          color: var(--navy);
          line-height: 1.5;
          margin-bottom: 3px;
        }
        .item-feedback {
          color: var(--gray);
          font-size: 0.78rem;
          line-height: 1.5;
        }

        /* 総評 */
        .summary-card {
          background: var(--white);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 12px rgba(13,27,53,0.06);
          margin-bottom: 2rem;
        }
        .summary-card h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .summary-text {
          color: #374151;
          line-height: 1.9;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .strength-improvement {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .strength-improvement { grid-template-columns: 1fr; }
        }
        .list-box {
          border-radius: 10px;
          padding: 1.2rem;
        }
        .list-box.strength { background: rgba(42,157,92,0.06); border: 1px solid rgba(42,157,92,0.2); }
        .list-box.improvement { background: rgba(232,160,32,0.06); border: 1px solid rgba(232,160,32,0.2); }
        .list-box h4 {
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .list-box.strength h4 { color: #2a9d5c; }
        .list-box.improvement h4 { color: #c97d0a; }
        .list-box ul {
          list-style: none;
        }
        .list-box li {
          font-size: 0.83rem;
          line-height: 1.6;
          padding: 4px 0;
          color: #374151;
          display: flex;
          gap: 6px;
        }
        .list-box li::before {
          flex-shrink: 0;
          font-size: 0.75rem;
          margin-top: 2px;
        }
        .list-box.strength li::before { content: "✓"; color: #2a9d5c; }
        .list-box.improvement li::before { content: "→"; color: #c97d0a; }

        /* 再診断ボタン */
        .btn-retry {
          display: block;
          width: 100%;
          background: transparent;
          border: 2px solid var(--blue);
          color: var(--blue);
          border-radius: 12px;
          padding: 0.9rem;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: "Noto Sans JP", sans-serif;
          cursor: pointer;
          margin-bottom: 3rem;
          transition: all 0.2s;
          letter-spacing: 0.05em;
        }
        .btn-retry:hover {
          background: var(--blue);
          color: white;
        }

        /* フッター */
        .footer {
          background: var(--navy);
          color: #6b7a99;
          text-align: center;
          padding: 2rem;
          font-size: 0.8rem;
        }
        .footer a { color: var(--accent); text-decoration: none; }
      `}</style>

      {/* ヘッダー */}
      <header className="header">
        <div className="header-logo">
          <span className="header-badge">株式会社2.1</span>
          <span className="header-title">業務マニュアル品質診断</span>
        </div>
        <span className="header-sub">AI診断システム β版</span>
      </header>

      {/* ヒーロー */}
      <div className="hero">
        <div className="hero-tag">中山亮 著書の基準に基づくAI診断</div>
        <h1>
          あなたのマニュアルは
          <br />
          <span>本当に使われていますか？</span>
        </h1>
        <p>
          「図解いちばんやさしく丁寧に書いた 業務マニュアルの作成」の基準で、
          <br />
          視認性・可読性・判読性など6つの観点から品質を診断します。
        </p>
      </div>

      <main className="main">
        {/* アップロード */}
        {!result && (
          <div className="upload-card">
            <h2>マニュアルをアップロード</h2>
            <div
              className={`dropzone${isDragging ? " active" : ""}${file ? " has-file" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                {file ? "📋" : "📄"}
              </div>
              {file ? (
                <>
                  <p className="file-name">{file.name}</p>
                  <p>({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
                </>
              ) : (
                <>
                  <p>
                    PDFファイルをここにドラッグ＆ドロップ
                    <br />
                    またはクリックしてファイルを選択
                  </p>
                  <p style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:"0.5rem"}}>／ 10MB以下・50ページ以内のPDFのみ ／
                  </p>
                  <button className="btn-select" type="button">
                    ファイルを選択
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {error && <div className="error-box">⚠ {error}</div>}

            <button
              className="btn-diagnose"
              onClick={handleDiagnose}
              disabled={!file || isLoading}
            >
              {isLoading ? "🔍 診断中..." : "🚀 AIで品質診断を開始する"}
            </button>

            {isLoading && (
              <div className="progress-wrap">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="progress-text">
                  AIがマニュアルを分析しています... {progress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* 結果 */}
        {result && scores && scoreLabel && (
          <div className="result-section">
            {/* 総合スコア */}
            <div className="score-card">
              <div
                className="score-rank"
                style={{ color: scoreLabel.color }}
              >
                {scoreLabel.label}
              </div>
              <div className="score-pct">
                {scores.totalGot} / {TOTAL_POINTS}点（{scores.totalPct}%）
              </div>
              <p className="score-message">{scoreLabel.message}</p>
            </div>

            {/* カテゴリ別 */}
            <div className="category-grid">
              {scores.categoryScores.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div className="category-header">
                    <div className="category-name">
                      <div
                        className="category-dot"
                        style={{ background: cat.color }}
                      />
                      {cat.category}
                    </div>
                    <div
                      className="category-score"
                      style={{ color: cat.color }}
                    >
                      {cat.got}/{cat.max}点
                    </div>
                  </div>
                  <div className="category-bar-bg">
                    <div
                      className="category-bar"
                      style={{
                        width: `${cat.pct}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                  <ul className="item-list">
                    {cat.items.map((item) => {
                      const s = result.scores[item.id] ?? 0;
                      const bg =
                        s >= 4
                          ? "#2a9d5c"
                          : s >= 2
                          ? "#e8a020"
                          : "#ef4444";
                      return (
                        <li key={item.id} className="item-row">
                          <div
                            className="item-score-badge"
                            style={{ background: bg }}
                          >
                            {s}
                          </div>
                          <div className="item-content">
                            <div className="item-text">{item.text}</div>
                            {result.feedback[item.id] && (
                              <div className="item-feedback">
                                {result.feedback[item.id]}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* 総評 */}
            <div className="summary-card">
              <h3>📝 総評</h3>
              <p className="summary-text">{result.overall_comment}</p>
              <div className="strength-improvement">
                <div className="list-box strength">
                  <h4>✓ 強み</h4>
                  <ul>
                    {result.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="list-box improvement">
                  <h4>→ 改善ポイント</h4>
                  <ul>
                    {result.improvements?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              className="btn-retry"
              onClick={() => {
                setResult(null);
                setFile(null);
                setError("");
              }}
            >
              別のマニュアルを診断する
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          © 株式会社2.1 ／ 診断基準：「図解いちばんやさしく丁寧に書いた 業務マニュアルの作成」中山亮 監修
        </p>
      </footer>
    </>
  );
}
