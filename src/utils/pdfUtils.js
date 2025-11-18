import PdfPrinter from 'pdfmake';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const watermarkPath = path.join(__dirname, `../assets/images/swaptography-TAB-watermark.png`);

const letterheadPath = path.join(__dirname, "../assets/images/LETTER HEAD JPG.jpg");

// ✅ Convert to base64
const letterhead = fs.readFileSync(letterheadPath).toString("base64");
const watermark = fs.readFileSync(watermarkPath).toString("base64");

// ✅ Prefix with proper MIME type
const letterheadImage = `data:image/jpeg;base64,${letterhead}`;
const watermarkImage = `data:image/jpeg;base64,${watermark}`;
// Define font configuration
const fonts = {
    Roboto: {
        normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
        bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
        italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
        bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf'
    }
};

const printer = new PdfPrinter(fonts);

export const generatePdf = async (data) => {
  try {
    
    

    const docDefinition = {
  background: function (currentPage, pageSize) {
    if (currentPage === 1) {
      return {
        image: letterheadImage, // your base64 letterhead image
        width: pageSize.width,
        absolutePosition: { x: 0, y: 0 },
        opacity: 1,
      };
    } else {
      return {
        image: watermarkImage, // optional watermark
        width: 300,
        absolutePosition: {
          x: (pageSize.width - 300) / 2,
          y: (pageSize.height - 300) / 2,
        },
        opacity: 0.1,
      };
    }
  },

  pageMargins: [60, 120, 60, 100],

  // content: [
  //   {
  //     text: 'CERTIFICATE',
  //     style: 'title',
  //     margin: [0, 40, 0, 20],
  //   },

  //   {
  //     text: `Swaptography Event's & Film's LLP.\nKalyan, Maharashtra 421301`,
  //     style: 'subheader',
  //     margin: [0, 0, 0, 40],
  //   },

  //   {
  //     text: `This is to certify that Mr. Rutvik Laxman Patil has completed the project report with us for his project report work on “Digitization Blueprint for Mawwment Ecosystem – Streamlining Event Booking, Vendor Coordination, and Lead Management” in fulfillment for the completion of his Course with MITSDE on PGDM Project Management as prescribed by MIT School of Distance Education, Pune. This project is a record of authentic work carried out by him under the guidance of our relevant department from Date – 30/06/2025.`,
  //     style: 'body',
  //     alignment: 'justify',
  //     margin: [0, 0, 0, 60],
  //   },

  //   {
  //     columns: [
  //       {
  //         width: '50%',
  //         stack: [
  //           { text: 'Name of Guide :', style: 'label' },
  //           { text: 'Swapnil Joshi', style: 'value' },
  //         ],
  //       },
  //       {
  //         width: '50%',
  //         stack: [
  //           { text: 'Signature of Guide :', style: 'label' },
  //           { text: '_____________________', style: 'value' },
  //         ],
  //       },
  //     ],
  //     columnGap: 40,
  //     margin: [0, 40, 0, 60],
  //   },

  //   {
  //     text: 'Kalyan, Maharashtra 421301',
  //     style: 'footer',
  //     alignment: 'right',
  //   },
  // ],

  styles: {
    title: {
      fontSize: 26,
      bold: true,
      alignment: 'center',
      color: '#000',
    },
    subheader: {
      fontSize: 14,
      bold: false,
      alignment: 'center',
    },
    body: {
      fontSize: 12,
      lineHeight: 1.5,
    },
    label: {
      fontSize: 12,
      bold: true,
    },
    value: {
      fontSize: 12,
      margin: [0, 4, 0, 0],
    },
    footer: {
      fontSize: 10,
      italics: true,
    },
  },
};


    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => null);
        pdfDoc.end();

        return new Promise((resolve, reject) => {
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
    });

    pdfDoc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
            throw new Error('Error generating PDF');
  }
};
