// 診断基準データ（著書「図解いちばんやさしく丁寧に書いた 業務マニュアルの作成」中山亮 監修 に基づく）

export const CRITERIA = [
  {
    id: "visibility",
    category: "視認性",
    description: "文字の見やすさ（p.94）",
    color: "#1a7aad",
    weight: 20,
    items: [
      {
        id: "v1",
        text: "余白が適切に設定されており、文字がビッシリ詰まっていない",
        points: 5,
      },
      {
        id: "v2",
        text: "文字の大きさ・太さにメリハリがあり、重要箇所が目立つ",
        points: 5,
      },
      {
        id: "v3",
        text: "行間・文字間が適切で、読みやすい間隔が確保されている",
        points: 5,
      },
      {
        id: "v4",
        text: "フォントの色使いが統一されており、過度な色使いがない",
        points: 5,
      },
    ],
  },
  {
    id: "readability",
    category: "可読性",
    description: "文章の読みやすさ（p.94）",
    color: "#2a9d5c",
    weight: 20,
    items: [
      {
        id: "r1",
        text: "一文が長すぎず、読んでいて疲れない文章になっている",
        points: 5,
      },
      {
        id: "r2",
        text: "言葉のつながりが自然で、文章の流れが理解しやすい",
        points: 5,
      },
      {
        id: "r3",
        text: "箇条書きや番号付きリストを活用して情報が整理されている",
        points: 5,
      },
      {
        id: "r4",
        text: "専門用語や略語に説明・補足がある",
        points: 5,
      },
    ],
  },
  {
    id: "comprehensibility",
    category: "判読性",
    description: "内容のわかりやすさ（p.94）",
    color: "#e07b2a",
    weight: 20,
    items: [
      {
        id: "c1",
        text: "読み手（対象者）の立場で書かれており、誰が読んでも理解できる",
        points: 5,
      },
      {
        id: "c2",
        text: "「階段化」（難易度・詳細度が段階的）を意識した構成になっている",
        points: 5,
      },
      {
        id: "c3",
        text: "図解・イラスト・写真などビジュアルを効果的に活用している",
        points: 5,
      },
      {
        id: "c4",
        text: "用語集が用意されており、内容の正しい解釈を助けている",
        points: 5,
      },
    ],
  },
  {
    id: "structure",
    category: "構成の適切さ",
    description: "マインドセット・ワークフロー・オペレーション（p.96）",
    color: "#7b4fad",
    weight: 20,
    items: [
      {
        id: "s1",
        text: "マインドセット（業務の概要・目的・求める結果）が記載されている",
        points: 5,
      },
      {
        id: "s2",
        text: "ワークフロー（業務の流れ・手順の全体像）が示されている",
        points: 5,
      },
      {
        id: "s3",
        text: "オペレーション（各作業の具体的な行動詳細）が記載されている",
        points: 5,
      },
      {
        id: "s4",
        text: "業務の実態に即した内容であり、理想論ではなく実践的である",
        points: 5,
      },
    ],
  },
  {
    id: "format",
    category: "フォーマットの規則性",
    description: "法則性・統一感（p.114）",
    color: "#c0392b",
    weight: 10,
    items: [
      {
        id: "f1",
        text: "ページごとにレイアウトが統一されており、法則性がある",
        points: 5,
      },
      {
        id: "f2",
        text: "見出しのレベル（大・中・小）が一貫したルールで使われている",
        points: 5,
      },
    ],
  },
  {
    id: "searchability",
    category: "検索性",
    description: "目次・用語集による情報アクセス（p.118）",
    color: "#16a085",
    weight: 10,
    items: [
      {
        id: "se1",
        text: "目次があり、確認したい情報にすばやくたどり着ける",
        points: 5,
      },
      {
        id: "se2",
        text: "タイトルが業務内容を的確に表しており、わかりやすい",
        points: 5,
      },
    ],
  },
];

export const TOTAL_POINTS = CRITERIA.reduce(
  (sum, cat) => sum + cat.items.reduce((s, item) => s + item.points, 0),
  0
);

export function getScoreLabel(score: number): {
  label: string;
  color: string;
  message: string;
} {
  if (score >= 90)
    return {
      label: "S",
      color: "#FFD700",
      message: "優秀！株式会社2.1の基準を満たす高品質マニュアルです。",
    };
  if (score >= 75)
    return {
      label: "A",
      color: "#4CAF50",
      message: "良好。いくつかの改善点を加えることでさらに良くなります。",
    };
  if (score >= 60)
    return {
      label: "B",
      color: "#2196F3",
      message: "標準的。重点項目を改善することで品質が大きく向上します。",
    };
  if (score >= 40)
    return {
      label: "C",
      color: "#FF9800",
      message: "改善が必要。複数のカテゴリで見直しが求められます。",
    };
  return {
    label: "D",
    color: "#F44336",
    message: "大幅な改善が必要。マニュアルの構成から見直しましょう。",
  };
}
