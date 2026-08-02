import io
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
import pandas as pd

from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.recommendation import Recommendation
from app.models.prediction import Prediction
from app.models.health_score import FinancialHealthScore

# ReportLab imports safely
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
except ImportError:
    letter = None

class ReportGenerator:
    def __init__(self, db: Session):
        self.db = db

    def generate_report_data(self, user_id: int, report_type: str) -> Dict[str, Any]:
        """Compiles user financial data summaries according to interval rules (daily, weekly, monthly, yearly)."""
        today = date.today()
        
        # 1. Determine Date Range
        if report_type == "daily":
            start_date = today
            end_date = today
        elif report_type == "weekly":
            start_date = today - timedelta(days=7)
            end_date = today
        elif report_type == "monthly":
            start_date = today.replace(day=1)
            end_date = today
        elif report_type == "yearly":
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:
            raise ValueError(f"Invalid report type: {report_type}")

        # 2. Gather summaries
        inc_sum = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= start_date,
            Income.income_date <= end_date
        ).scalar() or Decimal("0.00")

        exp_sum = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).scalar() or Decimal("0.00")

        savings = max(Decimal("0.00"), inc_sum - exp_sum)

        # Category spending list
        cat_spending = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(Expense.category).all()
        
        categories = [{ "category": r[0], "amount": float(r[1]) } for r in cat_spending]

        # Budgets summary
        budgets_list = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.year == today.year,
            Budget.month == today.month
        ).all()
        budgets = [{
            "category": b.category,
            "limit": float(b.amount_limit),
            "remaining": float(b.remaining_amount),
            "spent": float(b.amount_limit - b.remaining_amount)
        } for b in budgets_list]

        # Active savings goals
        goals_list = self.db.query(SavingsGoal).filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.status == "ACTIVE"
        ).all()
        goals = [{
            "name": g.goal_name,
            "target": float(g.target_amount),
            "saved": float(g.saved_amount)
        } for g in goals_list]

        # Latest AI recommendations
        recs_list = self.db.query(Recommendation).filter(
            Recommendation.user_id == user_id
        ).order_by(Recommendation.created_at.desc()).limit(5).all()
        recommendations = [{
            "title": r.title,
            "description": r.description,
            "priority": r.priority
        } for r in recs_list]

        # Health score
        health_record = self.db.query(FinancialHealthScore).filter(
            FinancialHealthScore.user_id == user_id
        ).first()
        health_score = health_record.score if health_record else 70

        return {
            "report_type": report_type,
            "date_range": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "income_total": float(inc_sum),
            "expense_total": float(exp_sum),
            "savings_total": float(savings),
            "financial_health_score": health_score,
            "categories": categories,
            "budgets": budgets,
            "goals": goals,
            "recommendations": recommendations
        }

    def generate_pdf_report(self, user_id: int, report_type: str) -> bytes:
        """Constructs a beautifully formatted PDF report containing AI recommendations and tables."""
        if not letter:
            raise ImportError("reportlab package is not installed.")

        data = self.generate_report_data(user_id, report_type)
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        
        styles = getSampleStyleSheet()
        
        # Define clean, modern color schemes
        indigo = colors.HexColor('#4f46e5')
        slate = colors.HexColor('#1e293b')
        emerald = colors.HexColor('#10b981')
        
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=indigo,
            spaceAfter=6
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=slate,
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            'BodyClean',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )
        bullet_style = ParagraphStyle(
            'BulletClean',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            leftIndent=15,
            spaceAfter=4
        )

        story = []

        # 1. Header
        story.append(Paragraph(f"AI-Powered Finance Statement", title_style))
        story.append(Paragraph(f"Interval: {report_type.capitalize()} Report • Period: {data['date_range']}", styles['Normal']))
        story.append(Spacer(1, 15))

        # 2. Key Summary statistics box
        summary_data = [
            ["Financial Health Rating", f"{data['financial_health_score']}/100"],
            ["Total Income", f"${data['income_total']:.2f}"],
            ["Total Expenses", f"${data['expense_total']:.2f}"],
            ["Net Savings", f"${data['savings_total']:.2f}"]
        ]
        
        sum_table = Table(summary_data, colWidths=[200, 300])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
            ('BACKGROUND', (1,0), (1,-1), colors.white),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1e293b')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 15))

        # 3. Budgets Summary Table
        story.append(Paragraph("Category Budgets Status", section_style))
        if not data["budgets"]:
            story.append(Paragraph("No active budget configurations.", body_style))
        else:
            budget_headers = ["Category", "Limit", "Spent", "Remaining"]
            budget_rows = [budget_headers]
            for b in data["budgets"]:
                budget_rows.append([
                    b["category"],
                    f"${b['limit']:.2f}",
                    f"${b['spent']:.2f}",
                    f"${b['remaining']:.2f}"
                ])
            
            b_table = Table(budget_rows, colWidths=[125] * 4)
            b_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), indigo),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ]))
            story.append(b_table)

        # 4. AI Recommendations list
        story.append(Spacer(1, 15))
        story.append(Paragraph("AI Recommendations & Insights", section_style))
        if not data["recommendations"]:
            story.append(Paragraph("No recommendations compiled yet.", body_style))
        else:
            for r in data["recommendations"]:
                prio_color = "red" if r["priority"] == "HIGH" else "orange"
                rec_text = f"<b>{r['title']} ({r['priority']})</b>: {r['description']}"
                story.append(Paragraph(f"• {rec_text}", bullet_style))

        doc.build(story)
        return output.getvalue()
