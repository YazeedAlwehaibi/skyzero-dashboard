from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from io import BytesIO
from reportlab.pdfgen import canvas
from datetime import datetime
import os

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
import matplotlib.pyplot as plt

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# ====== بيانات الانبعاثات الأساسية ======
EMISSION_FACTORS = {
    "GSE": 0.003,         # طن CO2 لكل لتر ديزل (أو لكل وحدة GSE = متوسط 3 لتر لكل ساعة تشغيل × 0.003)
    "Electricity": 0.000568,  # طن CO2 لكل ك.و.س (بحسب EF لشبكة السعودية 2023)
    "Water": 0.000344,     # طن CO2 لكل م³ (نفس القيمة السابقة لأنها دقيقة)
    "Waste": 0.0017,       # طن CO2 لكل كجم (مكافئ تقريبي لحرق نفايات بلدية)
    "Renewable": -1.0,     # -1 طن لكل 1 طن منتج أو MWh (تعويض كامل)
    "Aircraft": 0.115      # طن CO2 لكل كم طيران (لكل مقعد في المتوسط) ← حسب ICAO
}


manual_data = {
    "GSE": 3100,            # عدد ساعات تشغيل المعدات الأرضية (ساعة)
    "Electricity": 910000,  # استهلاك الكهرباء بالكيلو واط ساعة (kWh)
    "Water": 27_500,        # استهلاك المياه بالمتر المكعب (m³)
    "Waste": 11_500,        # نفايات بلدية بالكيلوغرام (kg)
    "Renewable": -1_800,    # الطاقة المتجددة المستخدمة (MWh) كتعويض
    "Aircraft": 600_000     # عدد كيلومترات الرحلات (العدد × المسافة)
}

# ====== دالة حساب الانبعاثات العامة (بدون تعويضات مخصصة) ======
def calculate_emissions():
    breakdown = {}
    total = 0.0

    for section, amount in manual_data.items():
        emission = amount * EMISSION_FACTORS.get(section, 0)
        breakdown[section] = {"value": round(emission, 1)}
        if emission > 0:
            total += emission

    if "Renewable" not in breakdown:
        breakdown["Renewable"] = {"value": 0}

    for section in breakdown:
        if section == "Renewable":
            continue
        percent = (breakdown[section]["value"] / total) * 100 if total else 0
        breakdown[section]["change"] = round(percent, 1)

    total_emissions = sum(v["value"] for v in breakdown.values() if v["value"] > 0)
    total_offset = abs(sum(v["value"] for v in breakdown.values() if v["value"] < 0))
    net_emissions = total_emissions - total_offset
    reduction_percentage = abs((total_offset / total) * 100) if total else 0
    efficiency = abs((1-(net_emissions / total)) * 100) if total else 0
    print("Net Emissions:", net_emissions)
    print("Net Emissions:", efficiency)


    return {
        "total": round(total, 2),
        "breakdown": breakdown,
        "total_offset": round(total_offset, 2),
        "net_emissions": round(net_emissions),
        "reduction_percentage": round(reduction_percentage),
        "efficiency": round(efficiency)
    }
# ====== Endpoint: الانبعاثات بدون تعويض ======
@app.route('/api/total_emissions', methods=['GET'])
def total_emissions():
    return jsonify(calculate_emissions())

# ====== Endpoint: إنشاء تقرير PDF ======
@app.route('/api/export_offset_report', methods=['POST'])
def export_offset_report():
    result = calculate_emissions()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ===== Header =====
    elements.append(Paragraph("<b>Carbon Offset Analysis Report</b>", styles['Title']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"<b>Generated on:</b> {now}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # ===== Summary =====
    summary = [
        ["Total Emissions", f"{result['total']} kg CO₂e"],
        ["Total Offset", f"{result['total_offset']} kg CO₂e"],
        ["Net Emissions", f"{result['net_emissions']} kg CO₂e"],
        ["Reduction Achieved", f"{result['reduction_percentage']} %"],
    ]
    table = Table(summary, hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 12))

    # ===== Emissions Breakdown Table =====
    elements.append(Paragraph("<b>Emissions Breakdown:</b>", styles['Heading2']))
    elements.append(Spacer(1, 8))
    breakdown_data = [["Source", "Emissions (kg CO₂e)", "Contribution (%)"]]
    for section, val in result["breakdown"].items():
        breakdown_data.append([
            section,
            str(val["value"]),
            f"{val.get('change', 0)}%"
        ])
    breakdown_table = Table(breakdown_data, hAlign='LEFT')
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
    ]))
    elements.append(breakdown_table)
    elements.append(Spacer(1, 24))

    # ===== Pie Chart: Emission Contributions =====
    pie_buffer = BytesIO()
    labels = [k for k in result["breakdown"] if result["breakdown"][k]["value"] > 0]
    sizes = [result["breakdown"][k]["value"] for k in labels]

    plt.figure(figsize=(4.5, 4))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.title("Emission Contribution by Source")
    plt.tight_layout()
    plt.savefig(pie_buffer, format='png')
    plt.close()
    pie_buffer.seek(0)
    pie_img = Image(pie_buffer, width=300, height=250)
    elements.append(pie_img)

    # ===== Finalize PDF =====
    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="offset-report.pdf", mimetype='application/pdf')


# ====== ✅ Endpoint جديد: انبعاثات مع تعويض ======
@app.route('/api/emissions_with_offset', methods=['POST'])
def emissions_with_offset():
    data = request.get_json()

    if not data or "strategies" not in data:
        return jsonify({"error": "Invalid input"}), 400

    strategies = data["strategies"]

    # حساب الانبعاثات الأساسية (من manual_data)
    total_emissions = 0.0
    for section, amount in manual_data.items():
        factor = EMISSION_FACTORS.get(section, 0)
        emission = amount * factor
        if emission > 0:
            total_emissions += emission

    # حساب إجمالي التعويضات من الاستراتيجيات القادمة من الفرونت
    total_offset = 0.0
    for s in strategies:
        try:
            value = float(s.get("value", 0))
            impact_rate = float(s.get("impactRate", 0))
            total_offset += value * impact_rate
        except (TypeError, ValueError):
            continue

    # تحويل من كجم إلى طن
    total_offset_tonnes = total_offset / 1000
    net_emissions = total_emissions - total_offset_tonnes
    reduction_percentage = (total_offset_tonnes / total_emissions) * 100 if total_emissions else 0

    return jsonify({
        "total_emissions": round(total_emissions, 2),
        "total_offset": round(total_offset_tonnes, 2),
        "net_emissions": round(max(net_emissions, 0), 2),
        "reduction_percentage": round(min(reduction_percentage, 100), 1)
    })

# ====== Route لواجهة الفرونتند ======

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    print("🔍 Requested path:", path)

    # تجاهل مسارات API
    if request.path.startswith("/api/"):
        return jsonify({"error": "API endpoint not found"}), 404

    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path) and not os.path.isdir(file_path):
        return send_from_directory(app.static_folder, path)

    # إذا ما لقى الملف، يرجّع index.html ليكمل React شغله
    return send_from_directory(app.static_folder, 'index.html')




# ====== تشغيل التطبيق ======
if __name__ == "__main__":
    app.run(debug=True)
