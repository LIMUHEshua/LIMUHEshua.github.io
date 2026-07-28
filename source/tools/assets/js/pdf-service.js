// PDF处理服务
class PDFService {
  constructor() {
    this.pdfjsLib = null;
    this.initPDFJS();
  }

  // 初始化PDF.js库
  async initPDFJS() {
    try {
      // 动态加载PDF.js库
      await this.loadPDFJS();
      console.log('PDF.js 加载成功');
    } catch (error) {
      console.error('PDF.js 加载失败:', error);
    }
  }

  // 加载PDF.js库
  async loadPDFJS() {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (typeof pdfjsLib !== 'undefined') {
        this.pdfjsLib = pdfjsLib;
        resolve();
        return;
      }

      // 动态创建script标签加载PDF.js
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
      script.onload = () => {
        this.pdfjsLib = pdfjsLib;
        // 设置worker路径
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 解析PDF文件
  async parsePDF(file) {
    if (!this.pdfjsLib) {
      await this.initPDFJS();
    }

    const fileReader = new FileReader();
    const data = await new Promise((resolve, reject) => {
      fileReader.onload = (e) => resolve(e.target.result);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });

    const pdfDocument = await this.pdfjsLib.getDocument({ data }).promise;
    const pages = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent();
      pages.push({
        pageNumber: i,
        text: content.items.map(item => item.str).join('\n')
      });
    }

    return {
      numPages: pdfDocument.numPages,
      pages
    };
  }

  // PDF转文本
  async pdfToText(file) {
    const pdfData = await this.parsePDF(file);
    const text = pdfData.pages.map(page => page.text).join('\n\n');
    return this.createDownloadableFile(text, 'converted.txt', 'text/plain');
  }

  // PDF转Word (模拟实现，实际需要更复杂的处理)
  async pdfToWord(file) {
    const pdfData = await this.parsePDF(file);
    // 简单的Word文档生成
    const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Converted from PDF</title>
</head>
<body>
${pdfData.pages.map(page => `<h2>Page ${page.pageNumber}</h2><p>${page.text.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>`;
    return this.createDownloadableFile(content, 'converted.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  // PDF转Excel (模拟实现，实际需要更复杂的处理)
  async pdfToExcel(file) {
    const pdfData = await this.parsePDF(file);
    // 简单的Excel生成
    const csvContent = pdfData.pages.map(page => page.text).join('\n\n');
    return this.createDownloadableFile(csvContent, 'converted.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // PDF转图片 (模拟实现)
  async pdfToImage(file) {
    if (!this.pdfjsLib) {
      await this.initPDFJS();
    }

    const fileReader = new FileReader();
    const data = await new Promise((resolve, reject) => {
      fileReader.onload = (e) => resolve(e.target.result);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });

    const pdfDocument = await this.pdfjsLib.getDocument({ data }).promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = canvas.toDataURL('image/jpeg');

    // 将base64转换为Blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // 创建可下载文件
  createDownloadableFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  // 执行转换
  async convert(file, format) {
    switch (format) {
      case 'txt':
        return await this.pdfToText(file);
      case 'docx':
        return await this.pdfToWord(file);
      case 'xlsx':
        return await this.pdfToExcel(file);
      case 'jpg':
        return await this.pdfToImage(file);
      default:
        throw new Error('不支持的格式');
    }
  }
}

// 导出单例
const pdfService = new PDFService();
export default pdfService;