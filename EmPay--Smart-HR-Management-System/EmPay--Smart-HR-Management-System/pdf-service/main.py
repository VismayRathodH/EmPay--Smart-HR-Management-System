"""
EmPay PDF Service - Microservice for generating payslips
Runs on port 8001
Uses ReportLab for PDF generation
"""
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

app = FastAPI(
    title="EmPay PDF Service",
    description="PDF generation microservice for payslips",
    version="1.0.0",
)


class PayslipRequest(BaseModel):
    """Request model for payslip PDF generation"""
    id: int
    month: int
    year: int
    employee: Dict[str, Any]
    attendance: Dict[str, float]
    salary_components: Dict[str, float]
    deductions: Dict[str, float]
    net_pay: float
    created_at: str


def format_currency(amount: float) -> str:
    """Format amount as Indian currency"""
    return f"₹ {amount:,.2f}"


def generate_payslip_pdf(payslip_data: PayslipRequest) -> bytes:
    """
    Generate payslip PDF using ReportLab

    Args:
        payslip_data: Payslip data from the request

    Returns:
        PDF as bytes
    """
    buffer = BytesIO()

    # Create PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#333333'),
        spaceAfter=6,
        spaceBefore=6,
        fontName='Helvetica-Bold',
    )

    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
    )

    # Title
    elements.append(Paragraph("PAYSLIP", title_style))
    elements.append(Spacer(1, 0.1*inch))

    # Company and month info
    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    month_str = f"{month_names[payslip_data.month]} {payslip_data.year}"

    company_info = f"""
    <b>EmPay - Smart HR Management System</b><br/>
    For the month of <b>{month_str}</b>
    """
    elements.append(Paragraph(company_info, normal_style))
    elements.append(Spacer(1, 0.15*inch))

    # Employee Information
    elements.append(Paragraph("EMPLOYEE INFORMATION", heading_style))
    emp_data = payslip_data.employee
    emp_table = Table([
        ["Employee Code:", emp_data.get('employee_code', 'N/A'), "Name:", emp_data.get('full_name', 'N/A')],
        ["Email:", emp_data.get('email', 'N/A'), "Designation:", emp_data.get('designation', 'N/A')],
        ["Department:", emp_data.get('department', 'N/A'), "Payslip ID:", str(payslip_data.id)],
    ], colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])

    emp_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e0e0e0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 0.2*inch))

    # Attendance Information
    elements.append(Paragraph("ATTENDANCE", heading_style))
    att_data = payslip_data.attendance
    att_table = Table([
        ["Present Days:", f"{att_data['present_days']}", "Approved Leave Days:", f"{att_data['approved_leave_days']}"],
        ["Total Paid Days:", f"{att_data['paid_days']}", "", ""],
    ], colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])

    att_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e0e0e0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(att_table)
    elements.append(Spacer(1, 0.2*inch))

    # Salary Breakdown
    elements.append(Paragraph("SALARY BREAKDOWN", heading_style))
    sal_data = payslip_data.salary_components
    salary_table = Table([
        ["Basic Salary", format_currency(sal_data['basic_salary'])],
        ["House Rent Allowance (HRA)", format_currency(sal_data['hra'])],
        ["Special Allowance", format_currency(sal_data['special_allowance'])],
        ["GROSS SALARY", format_currency(payslip_data.salary_components.get('gross_salary', 0))],
    ], colWidths=[3*inch, 2*inch])

    salary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f4f8')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(salary_table)
    elements.append(Spacer(1, 0.2*inch))

    # Deductions
    elements.append(Paragraph("DEDUCTIONS", heading_style))
    ded_data = payslip_data.deductions
    deductions_table = Table([
        ["Provident Fund (PF)", format_currency(ded_data['pf_deduction'])],
        ["Professional Tax", format_currency(ded_data['professional_tax'])],
        ["TOTAL DEDUCTIONS", format_currency(ded_data['pf_deduction'] + ded_data['professional_tax'])],
    ], colWidths=[3*inch, 2*inch])

    deductions_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ffe8e8')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(deductions_table)
    elements.append(Spacer(1, 0.2*inch))

    # Net Pay
    net_pay_table = Table([
        ["NET PAY", format_currency(payslip_data.net_pay)],
    ], colWidths=[3*inch, 2*inch])

    net_pay_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#2ecc71')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#27ae60')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(net_pay_table)
    elements.append(Spacer(1, 0.3*inch))

    # Footer
    generated_date = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    footer = f"""
    <font size="8" color="#999999">
    Generated on {generated_date} | This is a system-generated document
    </font>
    """
    elements.append(Paragraph(footer, normal_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "EmPay PDF Service"}


@app.post("/generate-payslip")
async def generate_payslip(payslip_data: PayslipRequest):
    """
    Generate payslip PDF from payslip data

    Args:
        payslip_data: Payslip data including employee info, attendance, salary components, deductions

    Returns:
        PDF binary content with appropriate headers
    """
    try:
        pdf_bytes = generate_payslip_pdf(payslip_data)

        return {
            "pdf": pdf_bytes.hex(),  # Return as hex for JSON compatibility
            "filename": f"Payslip_{payslip_data.employee['employee_code']}_{payslip_data.month}_{payslip_data.year}.pdf",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
    )
