import io
import pandas as pd
from typing import List, Dict, Any, Tuple
from datetime import date
from decimal import Decimal

# ReportLab imports safely
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
except ImportError:
    letter = None
    colors = None

class ExportService:
    def _prepare_dataframe(self, module_name: str, items: List[Any]) -> pd.DataFrame:
        """Structures model list inputs into formatted pandas DataFrames for tabular export."""
        records = []
        
        if module_name == "income":
            for item in items:
                records.append({
                    "Date": item.income_date,
                    "Title": item.title,
                    "Category": item.category,
                    "Amount": float(item.amount),
                    "Description": item.description or ""
                })
            df = pd.DataFrame(records)
            if df.empty:
                df = pd.DataFrame(columns=["Date", "Title", "Category", "Amount", "Description"])
            return df

        elif module_name == "expense":
            for item in items:
                records.append({
                    "Date": item.expense_date,
                    "Title": item.title,
                    "Category": item.category,
                    "Amount": float(item.amount),
                    "Description": item.description or ""
                })
            df = pd.DataFrame(records)
            if df.empty:
                df = pd.DataFrame(columns=["Date", "Title", "Category", "Amount", "Description"])
            return df

        elif module_name == "budget":
            for item in items:
                records.append({
                    "Title": item.title,
                    "Category": item.category,
                    "Limit": float(item.amount_limit),
                    "Remaining": float(item.remaining_amount),
                    "Period": f"{item.year}-{item.month:02d}",
                    "Status": item.status
                })
            df = pd.DataFrame(records)
            if df.empty:
                df = pd.DataFrame(columns=["Title", "Category", "Limit", "Remaining", "Period", "Status"])
            return df

        elif module_name == "goal":
            for item in items:
                records.append({
                    "Goal Name": item.goal_name,
                    "Type": item.goal_type,
                    "Target Amount": float(item.target_amount),
                    "Saved Amount": float(item.saved_amount),
                    "Target Date": item.target_date,
                    "Status": item.status
                })
            df = pd.DataFrame(records)
            if df.empty:
                df = pd.DataFrame(columns=["Goal Name", "Type", "Target Amount", "Saved Amount", "Target Date", "Status"])
            return df

        elif module_name == "reminder":
            for item in items:
                records.append({
                    "Bill Title": item.title,
                    "Type": item.reminder_type,
                    "Amount": float(item.amount),
                    "Due Date": item.due_date,
                    "Repeat Cycle": item.repeat_interval,
                    "Paid?": "Yes" if item.is_completed else "No"
                })
            df = pd.DataFrame(records)
            if df.empty:
                df = pd.DataFrame(columns=["Bill Title", "Type", "Amount", "Due Date", "Repeat Cycle", "Paid?"])
            return df

        return pd.DataFrame()

    def generate_csv(self, module_name: str, items: List[Any]) -> bytes:
        df = self._prepare_dataframe(module_name, items)
        return df.to_csv(index=False).encode('utf-8')

    def generate_xlsx(self, module_name: str, items: List[Any]) -> bytes:
        df = self._prepare_dataframe(module_name, items)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=module_name.capitalize(), index=False)
        return output.getvalue()

    def generate_pdf(self, module_name: str, items: List[Any]) -> bytes:
        """Constructs a beautifully typeset table PDF with gridlines and indigo headers."""
        if not letter:
            raise ImportError("reportlab package is not installed.")

        df = self._prepare_dataframe(module_name, items)
        
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            textColor=colors.HexColor('#4f46e5'),
            spaceAfter=12
        )
        
        story = []
        
        # 1. Title Paragraph
        story.append(Paragraph(f"Personal Finance System: {module_name.capitalize()} Export", title_style))
        story.append(Paragraph(f"Generated on {date.today().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 15))
        
        # 2. Table Creation
        # Headers & data lists
        table_data = [list(df.columns)]
        for _, row in df.iterrows():
            # Format row values as string
            row_vals = [str(val) for val in row.values]
            table_data.append(row_vals)
            
        col_width = (doc.width) / len(df.columns)
        col_widths = [col_width] * len(df.columns)
        
        t = Table(table_data, colWidths=col_widths)
        
        # Indigo/slate premium table styling
        t_style = TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 10),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('TOPPADDING', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e4e4e7')),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,1), (-1,-1), 6),
            ('TOPPADDING', (0,1), (-1,-1), 6),
        ])
        
        # Alternating light row backgrounds (zebra striping)
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                t_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f4f4f5'))
                
        t.setStyle(t_style)
        story.append(t)
        
        doc.build(story)
        return output.getvalue()
