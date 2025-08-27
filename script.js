const { useState, useRef } = React;

const DeskChaosAnalyzer = () => {
  // 画像解析用の定数
  const ANALYSIS_CONSTANTS = {
    // 正規化の分母
    MAX_COLOR_COUNT: 150,
    MAX_VARIANCE: 6000,
    MAX_EDGE_COUNT: 8000,
    
    // 重み係数
    COLOR_WEIGHT: 0.25,
    CONTRAST_WEIGHT: 0.4,
    EDGE_WEIGHT: 0.35,
    
    // スコア調整
    SCORE_MULTIPLIER: 6,
    BASE_SCORE: 2,
    
    // 閾値
    EDGE_THRESHOLD: 30,
    HIGH_EDGE_THRESHOLD: 6000,
    MEDIUM_EDGE_THRESHOLD: 3000,
    LOW_EDGE_THRESHOLD: 1000,
    HIGH_COLOR_THRESHOLD: 130,
    LOW_COLOR_THRESHOLD: 70,
    HIGH_VARIANCE_THRESHOLD: 5000,
    LOW_VARIANCE_THRESHOLD: 2000
  };

  // lucideがロードされた後にアイコンを取得
  const { Upload, RefreshCw, Star, Camera } = window.lucide || {};
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // ファイル選択用とカメラ用のinputをそれぞれ参照
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // カオス度のレベル定義
  const chaosLevels = [
    { level: 1, title: "禅の境地", description: "机の上が美しすぎて、もはや虚空", emoji: "🧘‍♀️" },
    { level: 2, title: "ミニマリスト", description: "シンプルさが際立つ、洗練されたワークスペース", emoji: "✨" },
    { level: 3, title: "普通", description: "ごく一般的な机の状態。平和そのもの", emoji: "😊" },
    { level: 4, title: "創造的混沌", description: "アーティストの作業場のような、インスピレーション溢れる状態", emoji: "🎨" },
    { level: 5, title: "研究者の机", description: "知的探求の痕跡が見える、学問への情熱を感じる散らかり方", emoji: "🔬" },
    { level: 6, title: "天才の証拠", description: "アインシュタイン級の散らかり具合。天才は机も独創的", emoji: "🧠" },
    { level: 7, title: "冒険者の拠点", description: "まるでRPGの道具屋。何が出てくるかわからないワクワク感", emoji: "🗡️" },
    { level: 8, title: "考古学的価値", description: "文明の層が積み重なった、歴史的意義のある状態", emoji: "🏺" },
    { level: 9, title: "異次元ポータル", description: "物理法則を超越した、もはや別次元への入り口", emoji: "🌀" },
    { level: 10, title: "宇宙の神秘", description: "ビッグバン級のカオス。新しい宇宙が誕生しそう", emoji: "🌌" }
  ];

  // コメント集
  const Comments = [
    "この散らかり方にはストーリーを感じます",
    "創造性と実用性の絶妙なバランスですね",
    "きっと素晴らしいアイデアがこの机から生まれるでしょう",
    "机の状態は心の豊かさの表れです",
    "整理整頓より大切なことがあることを教えてくれます",
    "この机には持ち主の個性が溢れています",
    "機能美を超えた、新しい美学を感じます"
  ];

  // 画像がアップロードされたときの処理
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        console.error('画像ファイルを選択してください。');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MBに上限を緩和
        console.error('ファイルサイズは10MB以下にしてください。');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setAnalysis(null);
      };
      reader.onerror = () => {
        console.error('ファイルの読み込みに失敗しました。');
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像を解析してカオス度を算出する関数
  const analyzeImageChaos = (imageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 300;
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const colorSet = new Set();
    const brightness = [];
    
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorSet.add(colorKey);
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      brightness.push(gray);
    }
    
    const mean = brightness.reduce((a, b) => a + b, 0) / brightness.length;
    const variance = brightness.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / brightness.length;

    //エッジ数計算
    let edgeCount = 0;
    const width = canvas.width;
    
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x += 4) {
        const idx = (y * width + x) * 4;
        const current = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
        const down = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];
        
        if (Math.abs(current - right) > ANALYSIS_CONSTANTS.EDGE_THRESHOLD || Math.abs(current - down) > ANALYSIS_CONSTANTS.EDGE_THRESHOLD) {
          edgeCount++;
        }
      }
    }
    
    //スコア計算
    const colorDiversity = Math.min(colorSet.size / ANALYSIS_CONSTANTS.MAX_COLOR_COUNT, 1);
    const contrastLevel = Math.min(variance / ANALYSIS_CONSTANTS.MAX_VARIANCE, 1);
    const edgeDensity = Math.min(edgeCount / ANALYSIS_CONSTANTS.MAX_EDGE_COUNT, 1);
    
    const chaosScore = Math.floor((colorDiversity * ANALYSIS_CONSTANTS.COLOR_WEIGHT + contrastLevel * ANALYSIS_CONSTANTS.CONTRAST_WEIGHT + edgeDensity * ANALYSIS_CONSTANTS.EDGE_WEIGHT) * ANALYSIS_CONSTANTS.SCORE_MULTIPLIER) + ANALYSIS_CONSTANTS.BASE_SCORE;
    let adjustedScore = chaosScore;
    
    if (edgeCount > ANALYSIS_CONSTANTS.HIGH_EDGE_THRESHOLD) adjustedScore = Math.min(10, adjustedScore + 2);
    else if (edgeCount > ANALYSIS_CONSTANTS.MEDIUM_EDGE_THRESHOLD) adjustedScore = Math.min(10, adjustedScore + 1);
    else if (edgeCount < ANALYSIS_CONSTANTS.LOW_EDGE_THRESHOLD) adjustedScore = Math.max(1, adjustedScore - 4);
    
    if (colorSet.size > ANALYSIS_CONSTANTS.HIGH_COLOR_THRESHOLD) adjustedScore = Math.min(10, adjustedScore + 1);
    else if (colorSet.size < ANALYSIS_CONSTANTS.LOW_COLOR_THRESHOLD) adjustedScore = Math.max(1, adjustedScore - 3);
    
    if (variance > ANALYSIS_CONSTANTS.HIGH_VARIANCE_THRESHOLD) adjustedScore = Math.min(10, adjustedScore + 1);
    else if (variance < ANALYSIS_CONSTANTS.LOW_VARIANCE_THRESHOLD) adjustedScore = Math.max(1, adjustedScore - 2);
    
    return {
      chaosLevel: Math.max(1, Math.min(10, adjustedScore)),
      metrics: {
        colorCount: colorSet.size,
        variance: Math.round(variance),
        edgeCount: edgeCount,
        colorDiversity: Math.round(colorDiversity * 100),
        contrast: Math.round(contrastLevel * 100),
        edgeComplexity: Math.round(edgeDensity * 100)
      }
    };
  };

  // 解析ボタンが押されたときの処理
  const analyzeDesk = () => {
    if (!image) return;
    setIsAnalyzing(true);
    const img = new Image();
    img.onload = () => {
      try {
        const analysisResult = analyzeImageChaos(img);
        const selectedLevel = chaosLevels[analysisResult.chaosLevel - 1];
        const randomComment = Comments[Math.floor(Math.random() * Comments.length)];

        const details = {
          creativity: Math.min(100, analysisResult.metrics.colorDiversity + Math.floor(Math.random() * 20)),
          organization: Math.max(10, 110 - analysisResult.chaosLevel * 10 + Math.floor(Math.random() * 20)),
          inspiration: Math.min(100, analysisResult.metrics.edgeComplexity + Math.floor(Math.random() * 30) + 50),
          mystery: Math.min(100, analysisResult.chaosLevel * 8 + Math.floor(Math.random() * 30)),
        };
        
        setAnalysis({
          ...selectedLevel,
          comment: randomComment,
          details: details,
          metrics: analysisResult.metrics,
          analysisDate: new Date().toLocaleString('ja-JP')
        });
      } catch (error) {
        console.error('画像解析エラー:', error);
        const randomLevel = Math.floor(Math.random() * 10);
        setAnalysis({
          ...chaosLevels[randomLevel],
          comment: positiveComments[Math.floor(Math.random() * positiveComments.length)],
          details: { creativity: 75, organization: 40, inspiration: 88, mystery: 60 },
          analysisDate: new Date().toLocaleString('ja-JP')
        });
      }
      setIsAnalyzing(false);
    };
    img.src = image;
  };

  // リセット処理
  const resetAnalysis = () => {
    setImage(null);
    setAnalysis(null);
  };

  return (
    <React.Fragment>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {!image ? (
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-4">
              {Camera && <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />}
              <p className="text-gray-600 mb-4">
                机の上の写真をアップロードまたは撮影してください<br/>
                <span className="text-sm text-gray-500">
                  （画像ファイル / 10MB以下）
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 justify-center transition-transform transform hover:scale-105"
                >
                  {Upload && <Upload className="h-5 w-5" />}
                  ファイル選択
                </button>
                <button
                  onClick={() => cameraInputRef.current.click()}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 justify-center transition-transform transform hover:scale-105"
                >
                  {Camera && <Camera className="h-5 w-5" />}
                  カメラで撮影
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                capture="camera"
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <img 
              src={image} 
              alt="机の写真" 
              className="mx-auto max-w-full h-64 object-cover rounded-lg mb-4 border-2 border-gray-200"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={analyzeDesk}
                disabled={isAnalyzing}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <React.Fragment>
                    {RefreshCw && <RefreshCw className="h-5 w-5 animate-spin" />}
                    分析中...
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    {Star && <Star className="h-5 w-5" />}
                    カオス度を測定
                  </React.Fragment>
                )}
              </button>
              <button
                onClick={resetAnalysis}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{analysis.emoji}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              カオス度: レベル{analysis.level}
            </h2>
            <h3 className="text-xl font-semibold text-purple-600 mb-4">
              「{analysis.title}」
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              {analysis.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.details.creativity}%</div>
              <div className="text-sm text-purple-800">創造性</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.details.organization}%</div>
              <div className="text-sm text-blue-800">整理整頓</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.details.inspiration}%</div>
              <div className="text-sm text-green-800">インスピレーション</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{analysis.details.mystery}%</div>
              <div className="text-sm text-orange-800">神秘性</div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
            <p className="text-yellow-800 font-medium">💡 コメント</p>
            <p className="text-yellow-700 mt-2">{analysis.comment}</p>
          </div>

          {analysis.metrics && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">📊 画像解析データ</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{analysis.metrics.colorCount}</div>
                  <div className="text-gray-600">検出色数</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{analysis.metrics.edgeCount}</div>
                  <div className="text-gray-600">エッジ数</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{analysis.metrics.variance}</div>
                  <div className="text-gray-600">明度分散</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                色の多様性: {analysis.metrics.colorDiversity}% | 
                コントラスト: {analysis.metrics.contrast}% | 
                複雑度: {analysis.metrics.edgeComplexity}%
              </div>
            </div>
          )}

          <div className="text-center mt-6 text-sm text-gray-500">
            分析日時: {analysis.analysisDate}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

const App = () => {
    return <DeskChaosAnalyzer />;
};

// DOMが読み込まれた後にReactアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
});
