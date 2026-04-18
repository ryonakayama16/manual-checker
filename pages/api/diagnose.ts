import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { CRITERIA } from "../../lib/criteria";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ maxFileSize: 50 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "ファイルの解析に失敗しました" });
    }

    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    if (!file) {
      return res.status(400).json({ error: "PDFファイルが見つかりません" });
    }

    try {
      // PDFテキスト抽出
      const pdfBuffer = fs.readFileSync(file.filepath);
      let pdfText = "";

      try {
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(pdfBuffer);
        pdfText = pdfData.text || "";
      } catch (e) {
        pdfText = "（PDFテキスト抽出不可 - 画像系PDFの可能性があります）";
      }

      // Anthropic APIで診断
      const criteriaText = CRITERIA.map((cat) => {
        const items = cat.items.map((item) => `  - ${item.text}`).join("\n");
        return `【${cat.category}】（${cat.description}）\n${items}`;
      }).join("\n\n");

      const prompt = `あなたは業務マニュアルの品質診断の専門家です。「図解いちばんやさしく丁寧に書いた 業務マニュアルの作成（中山亮 監修）」の基準に基づいて診断を行います。

以下の診断基準の各項目について、アップロードされた業務マニュアルを評価してください。

【診断基準】
${criteriaText}

【マニュアルの内容（抜粋）】
${pdfText.slice(0, 8000)}

各診断項目について以下のJSON形式で回答してください。必ずJSONのみを返し、説明文は不要です：

{
  "scores": {
    "v1": 0〜5の整数,
    "v2": 0〜5の整数,
    "v3": 0〜5の整数,
    "v4": 0〜5の整数,
    "r1": 0〜5の整数,
    "r2": 0〜5の整数,
    "r3": 0〜5の整数,
    "r4": 0〜5の整数,
    "c1": 0〜5の整数,
    "c2": 0〜5の整数,
    "c3": 0〜5の整数,
    "c4": 0〜5の整数,
    "s1": 0〜5の整数,
    "s2": 0〜5の整数,
    "s3": 0〜5の整数,
    "s4": 0〜5の整数,
    "f1": 0〜5の整数,
    "f2": 0〜5の整数,
    "se1": 0〜5の整数,
    "se2": 0〜5の整数
  },
  "feedback": {
    "v1": "この項目についての具体的なフィードバック（1〜2文）",
    "v2": "...",
    "v3": "...",
    "v4": "...",
    "r1": "...",
    "r2": "...",
    "r3": "...",
    "r4": "...",
    "c1": "...",
    "c2": "...",
    "c3": "...",
    "c4": "...",
    "s1": "...",
    "s2": "...",
    "s3": "...",
    "s4": "...",
    "f1": "...",
    "f2": "...",
    "se1": "...",
    "se2": "..."
  },
  "overall_comment": "マニュアル全体に対する総評（3〜5文、具体的な改善提案を含む）",
  "strengths": ["強み1", "強み2", "強み3"],
  "improvements": ["改善点1", "改善点2", "改善点3"]
}

採点基準：
5点 = 完全に満たしている
4点 = ほぼ満たしている
3点 = 部分的に満たしている
2点 = あまり満たしていない
1点 = ほとんど満たしていない
0点 = 全く満たしていない / 判断不可`;

      const anthropicRes = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY || "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      const anthropicData = await anthropicRes.json();
      const responseText =
        anthropicData.content?.[0]?.text || "";

      // JSONパース
      let diagnosisResult;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          diagnosisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("JSON not found");
        }
      } catch (e) {
        return res.status(500).json({ error: "診断結果の解析に失敗しました" });
      }

      // クリーンアップ
      try {
        fs.unlinkSync(file.filepath);
      } catch (e) {}

      return res.status(200).json({
        success: true,
        result: diagnosisResult,
        pageCount: pdfText.length > 100 ? "テキスト抽出成功" : "画像PDF",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "診断中にエラーが発生しました" });
    }
  });
}
