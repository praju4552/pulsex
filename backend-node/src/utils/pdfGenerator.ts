import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface PDFOrderData {
    salesOrderId: string;
    invoiceId: string;
    projectId: string;
    jobId: string;
    createdAt: Date;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    serviceType: string;
    specSummary: string;
    totalAmount: number; // in cents/paise
    shippingCost: number;
    pcbPrice: number;
    status: string;
}

export async function generateOrderPDF(res: Response, data: PDFOrderData, type: 'INVOICE' | 'SALES_ORDER') {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Pipe PDF to response
    doc.pipe(res);

    // --- HELPER: Draw Header ---
    const drawHeader = () => {
        // Logo Placeholder (Circular)
        doc.circle(70, 70, 35).fill('#1a3a6d');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('PULSE', 45, 65);
        
        // Company Info
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('PULSEWRITEX SOLUTIONS PRIVATE LIMITED', 120, 50);
        doc.font('Helvetica').fontSize(9).fillColor('#444444');
        doc.text('Chettiyavilai, Therivilai,', 120, 65);
        doc.text('Nithiravilai po, Kanjampuram via,', 120, 75);
        doc.text('Kanyakumari 629154 Tamil Nadu, India', 120, 85);
        doc.text('Company ID: U26109TN2025PTC176870', 120, 95);
        doc.text('GSTIN: 33AAPCP4334E1ZI', 120, 105);
        doc.text('https://pulsewritexsolutions.com/', 120, 115, { underline: true, link: 'https://pulsewritexsolutions.com/' });

        // Document Title
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(24).text(type === 'INVOICE' ? 'TAX INVOICE' : 'Sales Order', 350, 130, { align: 'right' });
    };

    drawHeader();

    // --- ID Information Bar ---
    doc.rect(40, 165, 515, 45).stroke('#dddddd');
    doc.font('Helvetica').fontSize(9).fillColor('#666666');
    
    const col1 = 45;
    const col2 = 140;
    const col3 = 300;
    const col4 = 400;

    doc.text(type === 'INVOICE' ? 'Invoice Number' : 'Sales Order#', col1, 175);
    doc.text(type === 'INVOICE' ? 'Invoice Date' : 'Order Date', col1, 190);
    
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text(`: ${type === 'INVOICE' ? data.invoiceId : data.salesOrderId}`, col2, 175);
    doc.text(`: ${data.createdAt.toLocaleDateString('en-GB')}`, col2, 190);

    doc.font('Helvetica').fillColor('#666666');
    doc.text('Place Of Supply', col3, 175);
    doc.text('Project ID', col3, 190);
    
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text(`: ${data.state} (${data.zip.slice(0, 2)})`, col4, 175);
    doc.text(`: ${data.projectId}`, col4, 190);

    // --- Bill To / Ship To ---
    doc.rect(40, 215, 255, 140).fillAndStroke('#f9f9f9', '#dddddd');
    doc.rect(300, 215, 255, 140).fillAndStroke('#f9f9f9', '#dddddd');
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
    doc.text('Bill To', 50, 225);
    doc.text('Ship To', 310, 225);

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    // Buyer
    doc.font('Helvetica-Bold').text(`${data.firstName} ${data.lastName}`, 50, 240);
    doc.font('Helvetica').text(data.email, 50, 252);
    doc.text(data.phone, 50, 264);
    doc.text(`${data.streetAddress}${data.apartment ? ', ' + data.apartment : ''}`, 50, 276, { width: 230 });
    doc.text(`${data.city}, ${data.state} - ${data.zip}`, 50, 305);
    doc.text(data.country, 50, 317);

    // Ship To (Mirror for now as requested by typical flow)
    doc.font('Helvetica-Bold').text(`ATTN : ${data.firstName} ${data.lastName}`, 310, 240);
    doc.font('Helvetica').text(`${data.streetAddress}${data.apartment ? ', ' + data.apartment : ''}`, 310, 252, { width: 230 });
    doc.text(`${data.city}, ${data.state} - ${data.zip}`, 310, 280);
    doc.text(data.country, 310, 292);
    doc.text(`+91${data.phone}`, 310, 304);

    // --- Items Table ---
    const tableTop = 365;
    doc.rect(40, tableTop, 515, 20).fill('#555555');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('#', 45, tableTop + 6);
    doc.text('Item & Description', 70, tableTop + 6);
    doc.text('HSN/SAC', 300, tableTop + 6);
    doc.text('Qty', 380, tableTop + 6);
    doc.text('Rate', 440, tableTop + 6);
    doc.text('Amount', 500, tableTop + 6, { align: 'right', width: 50 });

    doc.rect(40, tableTop + 20, 515, 80).stroke('#dddddd');
    doc.fillColor('#000000').font('Helvetica').fontSize(9);
    
    let y = tableTop + 30;
    doc.text('1', 45, y);
    doc.font('Helvetica-Bold').text(data.serviceType, 70, y);
    doc.font('Helvetica').fontSize(8).fillColor('#666666');
    doc.text(`SKU: ${data.serviceType === '3D Printing' ? 'LC-3D-FAB' : 'LC-PCB-FAB'}`, 70, y + 12);
    doc.text(`PID: ${data.projectId}`, 70, y + 22);
    doc.text(`Project Name: ${data.specSummary.slice(0, 30)}...`, 70, y + 32);
    
    doc.fontSize(9).fillColor('#000000');
    doc.text(data.serviceType === '3D Printing' ? '8477' : '85340000', 300, y);
    doc.text('1.00', 380, y);
    doc.text((data.pcbPrice / 100).toFixed(2), 440, y);
    doc.text((data.pcbPrice / 100).toFixed(2), 500, y, { align: 'right', width: 50 });

    // --- Summary Section ---
    const summaryTop = tableTop + 100;
    doc.rect(340, summaryTop, 215, 80).stroke('#dddddd');
    
    const sumLabelCol = 350;
    const sumValCol = 480;

    doc.font('Helvetica').fontSize(9).fillColor('#444444');
    doc.text('Sub Total', sumLabelCol, summaryTop + 10);
    doc.text('IGST18 (18%)', sumLabelCol, summaryTop + 25);
    doc.text('Shipping', sumLabelCol, summaryTop + 40);
    
    doc.fillColor('#000000');
    doc.text((data.pcbPrice / 100).toFixed(2), sumValCol, summaryTop + 10, { align: 'right', width: 70 });
    doc.text(((data.totalAmount - data.pcbPrice - data.shippingCost) / 100).toFixed(2), sumValCol, summaryTop + 25, { align: 'right', width: 70 });
    doc.text((data.shippingCost / 100).toFixed(2), sumValCol, summaryTop + 40, { align: 'right', width: 70 });

    doc.rect(340, summaryTop + 55, 215, 25).fill('#f5f5f5');
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11);
    doc.text('Total', sumLabelCol, summaryTop + 62);
    doc.text(`₹${(data.totalAmount / 100).toFixed(2)}`, sumValCol, summaryTop + 62, { align: 'right', width: 70 });

    // --- Footer & Signature ---
    doc.font('Helvetica').fontSize(8).fillColor('#888888');
    doc.text('Authorized Signature', 440, 750, { align: 'center' });
    doc.rect(420, 700, 120, 45).stroke('#eeeeee'); // Sig box

    doc.fontSize(7).text(`TXN No: ${data.jobId}`, 40, 780);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 790);

    doc.end();
}
