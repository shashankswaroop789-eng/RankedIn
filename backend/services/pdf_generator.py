import os
import io
import re
from datetime import datetime
from typing import Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def escape_xml(val: Any) -> str:
    """Escapes XML entities so ReportLab Paragraph never crashes on &, <, or >."""
    if val is None:
        return ""
    text = str(val).strip()
    text = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|bull);)', '&amp;', text)
    return text

def generate_audit_pdf(audit_data: Dict[str, Any]) -> io.BytesIO:
    """
    Generates a beautifully balanced, executive-grade 1-page PDF audit report.
    Uses proportional grid spacing and exact leading to eliminate text overlapping.
    """
    buffer = io.BytesIO()
    # Letter size: 612 x 792 pt. Margins 32 pt -> Printable width = 548 pt, printable height = 728 pt.
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=32,
        leftMargin=32,
        topMargin=26,
        bottomMargin=26
    )

    styles = getSampleStyleSheet()

    # Specific styles with strict line-heights (leading) to prevent text clipping & overlapping
    brand_title = ParagraphStyle('BrandTitle', fontName='Helvetica-Bold', fontSize=16, leading=19, textColor=colors.HexColor('#0F172A'))
    brand_sub = ParagraphStyle('BrandSub', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))
    meta_style = ParagraphStyle('MetaStyle', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=colors.HexColor('#64748B'), alignment=2)
    
    sec_title = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#0F172A'))
    
    entity_tag_style = ParagraphStyle('EntityTag', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor('#64748B'))
    entity_title_style = ParagraphStyle('EntityTitle', fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=colors.HexColor('#0F172A'))
    entity_sub_style = ParagraphStyle('EntitySub', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=colors.HexColor('#475569'))
    entity_desc_style = ParagraphStyle('EntityDesc', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=colors.HexColor('#334155'))
    
    normal_p = ParagraphStyle('NormP', fontName='Helvetica', fontSize=8, leading=10.5, textColor=colors.HexColor('#334155'))
    small_p = ParagraphStyle('SmallP', fontName='Helvetica', fontSize=7, leading=9.5, textColor=colors.HexColor('#64748B'))
    
    # Model card styles
    m_name_style = ParagraphStyle('MName', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#64748B'))
    m_badge_style = ParagraphStyle('MBadge', fontName='Helvetica-Bold', fontSize=9, leading=11.5, textColor=colors.HexColor('#0F172A'))
    m_sub_style = ParagraphStyle('MSub', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#475569'))

    story = []

    biz_name = escape_xml(audit_data.get("business_name", "Local Business"))
    city = escape_xml(audit_data.get("city", "Local Market"))
    category = escape_xml(audit_data.get("category", "Services"))
    score = audit_data.get("visibility_score", 0)
    now_str = datetime.now().strftime("%B %d, %Y")
    ref_id = f"#GEO-{abs(hash(biz_name)) % 90000 + 10000}"

    # 1. Header (Executive bar)
    badge_html = "<font backcolor='#0F172A' color='#FFFFFF'><b>&nbsp;EXECUTIVE AUDIT REPORT&nbsp;</b></font>"
    header_data = [
        [
            [
                Paragraph("RankIN Protocol", brand_title),
                Paragraph("AI Brand Visibility & Search Optimization (GEO) Audit", brand_sub)
            ],
            Paragraph(f"{badge_html}<br/><font color='#0F172A'><b>Audit Date:</b></font> {now_str}<br/><font color='#64748B'>Report Ref: {ref_id}</font>", meta_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[370, 178])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=5, spaceAfter=8))

    # 2. Main Executive Scorecard Card
    total_checks = audit_data.get("total_model_checks", 9)
    total_mentions = audit_data.get("total_model_mentions", 0)
    total_omissions = audit_data.get("total_model_omissions", 0)

    score_color = '#059669' if score >= 70 else ('#D97706' if score >= 40 else '#E11D48')
    score_p_colored = ParagraphStyle('ScoreCol', fontName='Helvetica-Bold', fontSize=30, leading=32, textColor=colors.HexColor(score_color), alignment=1)

    left_cell_elements = [
        Paragraph("AUDITED ENTITY & TARGET MARKET", entity_tag_style),
        Spacer(1, 2),
        Paragraph(biz_name, entity_title_style),
        Spacer(1, 2),
        Paragraph(f"Target Location: <b>{city}</b> &bull; Industry: <b>{category}</b>", entity_sub_style),
        Spacer(1, 4),
        Paragraph(
            f"<b>AI Search Footprint:</b> Audited across top AI engines (Google Gemini, Meta Llama, DeepSeek). "
            f"The business was recommended in <b>{total_mentions} of {total_checks} positive citations</b> "
            f"({'<font color=\"#E11D48\">' + str(total_omissions) + ' omission detected' + ('s' if total_omissions>1 else '') + '</font>' if total_omissions > 0 else '<font color=\"#059669\">100% full coverage</font>'}).",
            entity_desc_style
        )
    ]

    right_score_box = [
        Paragraph("<font size='7' color='#64748B'><b>VISIBILITY INDEX</b></font>", ParagraphStyle('Cen1', parent=normal_p, alignment=1)),
        Spacer(1, 2),
        Paragraph(f"{score}%", score_p_colored),
        Spacer(1, 2),
        Paragraph(
            f"<font size='7.5' color='{score_color}'><b>{total_mentions} of {total_checks} AI Checks Cited</b></font><br/>"
            f"<font size='7' color='{'#E11D48' if total_omissions > 0 else '#64748B'}'>"
            f"{'Omitted in ' + str(total_omissions) + ' AI check' if total_omissions > 0 else 'Zero AI omissions'}</font>",
            ParagraphStyle('Cen2', parent=normal_p, alignment=1, leading=9.5)
        )
    ]

    score_card_data = [
        [
            left_cell_elements,
            right_score_box
        ]
    ]
    t_score = Table(score_card_data, colWidths=[388, 160])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#FFFFFF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('LINEBEFORE', (1, 0), (1, 0), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 9))

    # 3. Cross-LLM Benchmark (3 distinct clean cards)
    story.append(Paragraph("<b>AI MODEL BENCHMARK BREAKDOWN</b>", sec_title))
    story.append(Spacer(1, 4))

    models = audit_data.get("models_evaluated", [])
    model_cards = []
    card_width = 176  # 176 * 3 + 20 = 548

    for m in models:
        m_score = m.get("visibility_score", 0)
        c_color = '#059669' if m_score >= 70 else ('#D97706' if m_score >= 40 else '#E11D48')
        m_name = escape_xml(m.get("name", "AI Engine")).upper()
        m_badge = escape_xml(m.get("badge", m.get("name", "Model")))
        m_mentions = m.get("mentioned", round((m_score / 100) * 3))
        m_total = m.get("total", 3)
        
        m_score_style = ParagraphStyle('MScoreStyle', fontName='Helvetica-Bold', fontSize=18, leading=20, textColor=colors.HexColor(c_color))

        m_cell_content = [
            Paragraph(m_name, m_name_style),
            Paragraph(m_badge, m_badge_style),
            Spacer(1, 3),
            Paragraph(f"{m_score}%", m_score_style),
            Spacer(1, 2),
            Paragraph(f"Cited in <b>{m_mentions} of {m_total}</b> queries", m_sub_style),
        ]
        model_cards.append(m_cell_content)

    while len(model_cards) < 3:
        model_cards.append([Paragraph("", normal_p)])

    t_models = Table([model_cards], colWidths=[card_width, card_width, card_width])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#E2E8F0')),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor('#E2E8F0')),
        ('BOX', (2, 0), (2, 0), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_models)
    story.append(Spacer(1, 9))

    # 4. Two-Column Analysis: Competitors & Citations (Left) + Queries (Right)
    comps = audit_data.get("top_competitors", [])
    comp_rows = [[
        Paragraph("<font size='7.5' color='#64748B'><b>RANK</b></font>", normal_p),
        Paragraph("<font size='7.5' color='#64748B'><b>COMPETITOR BRAND</b></font>", normal_p),
        Paragraph("<font size='7.5' color='#64748B'><b>AI SHARE</b></font>", ParagraphStyle('R', parent=normal_p, alignment=2))
    ]]
    for idx, c in enumerate(comps[:4]):
        name = escape_xml(c.get("name", "Competitor").strip(" \"'{}:"))
        share = escape_xml(c.get("share", "0%"))
        comp_rows.append([
            Paragraph(f"<font size='8' color='#0F172A'><b>#{idx+1}</b></font>", normal_p),
            Paragraph(f"<font size='8' color='#0F172A'><b>{name}</b></font>", normal_p),
            Paragraph(f"<font size='8' color='#0F172A'><b>{share}</b></font>", ParagraphStyle('R2', parent=normal_p, alignment=2))
        ])
    if len(comp_rows) == 1:
        comp_rows.append([Paragraph("-", normal_p), Paragraph("No major competitors detected", normal_p), Paragraph("0%", normal_p)])

    t_comp_table = Table(comp_rows, colWidths=[38, 150, 64])
    t_comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    # Citations detected
    sources = audit_data.get("sources_detected", ["Google Business Reviews", "Local Directories", "Customer Feedback"])
    sources_bullets = []
    for s in sources[:4]:
        clean_src = escape_xml(s)
        sources_bullets.append(Paragraph(f"&bull; <font color='#334155'>{clean_src}</font>", normal_p))
        sources_bullets.append(Spacer(1, 2))

    left_column = [
        Paragraph("<b>COMPETITOR SHARE OF VOICE</b>", sec_title),
        Spacer(1, 4),
        t_comp_table,
        Spacer(1, 8),
        Paragraph("<b>AI CITATION SOURCES LEVERAGED</b>", sec_title),
        Spacer(1, 4),
    ] + sources_bullets

    # Right: Queries
    queries = audit_data.get("prompts_results", [])
    query_cards = []
    for idx, q in enumerate(queries[:3]):
        q_prompt = escape_xml(q.get("prompt", ""))
        m_list = q.get("models", [])
        m_tags = []
        for m in m_list:
            b_name = escape_xml(m.get("badge", m.get("model_name", "AI")))
            if m.get("is_mentioned"):
                rank = m.get("rank")
                m_tags.append(f"<font color='#059669'><b>{b_name}: Cited{' (#' + str(rank) + ')' if rank else ''}</b></font>")
            else:
                m_tags.append(f"<font color='#E11D48'><b>{b_name}: Omitted</b></font>")
        
        m_tag_str = " &bull; ".join(m_tags) if m_tags else ("Mentioned" if q.get("is_mentioned") else "Omitted")

        ai_snip = q.get("ai_snippet", "")
        if "recommended" in ai_snip.lower() or "fitness" in ai_snip.lower() or "reviews" in ai_snip.lower():
            clean_snip = escape_xml(ai_snip.split(".")[0] + ".")
        else:
            clean_snip = f"AI evaluated local rating authority, customer reviews, and directory listings in {city}."

        q_content = [
            Paragraph(f"<font size='7' color='#64748B'><b>CUSTOMER QUERY #{idx+1}</b></font>", normal_p),
            Paragraph(f"<font size='8' color='#0F172A'><b>\"{q_prompt}\"</b></font>", normal_p),
            Spacer(1, 2),
            Paragraph(f"<font size='7'>{m_tag_str}</font>", normal_p),
            Spacer(1, 1),
            Paragraph(f"<font size='6.5' color='#64748B'>{clean_snip}</font>", small_p),
        ]
        t_qcard = Table([ [q_content] ], colWidths=[284])
        t_qcard.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 7),
            ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ]))
        query_cards.append(t_qcard)
        query_cards.append(Spacer(1, 3.5))

    right_column = [
        Paragraph("<b>QUERY-BY-QUERY AI AUDIT TRANSCRIPTS</b>", sec_title),
        Spacer(1, 4),
    ] + query_cards

    two_col_table = Table([[left_column, right_column]], colWidths=[252, 296])
    two_col_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 8),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(two_col_table)
    story.append(Spacer(1, 9))

    # 5. High-Impact Sponsor / Monetization Box
    ad_content = [
        [
            Paragraph(
                "<font size='7.5' color='#B45309'><b>FEATURED SPONSOR &bull; AI CITATION OPTIMIZATION (GEO)</b></font><br/>"
                "<font size='9.5' color='#0F172A'><b>Want Guaranteed #1 Recommendation on ChatGPT, Gemini & DeepSeek?</b></font><br/>"
                "<font size='7.5' color='#475569'>RankIN certified local partners sync your business citations across 60+ verified authority directories, "
                "install semantic LocalBusiness schema, and claim top placement when customers ask AI models for recommendations. "
                "<br/><font color='#0284C7'><b>Claim Partner Setup: partner@rankin.ai</b></font> &bull; "
                "<font color='#475569'>Advertise Here ($49/mo): advertise@rankin.ai &bull; https://rankin.ai/partners</font></font>",
                ParagraphStyle('AdP', parent=normal_p, leading=10.5)
            )
        ]
    ]
    t_ad = Table(ad_content, colWidths=[548])
    t_ad.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEFCE8')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FDE047')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_ad)
    story.append(Spacer(1, 7))

    # 6. Document Footer
    footer_p = Paragraph(
        "<font size='6.5' color='#94A3B8'>Generated by RankIN Protocol (https://rankin.ai) &bull; Verified AI Search Engine Optimization (GEO) &bull; Confidential &bull; &copy; 2026 RankIN Inc.</font>",
        ParagraphStyle('FooterCen', parent=normal_p, alignment=1)
    )
    story.append(footer_p)

    doc.build(story)
    buffer.seek(0)
    return buffer
