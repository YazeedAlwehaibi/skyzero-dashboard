from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from io import BytesIO
from reportlab.pdfgen import canvas
from datetime import datetime

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# ====== Frontend Route ======
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# ====== بيانات الانبعاثات ======
EMISSION_FACTORS = {
    "GSE": 2.68,
    "Electricity": 0.42,
    "Water": 0.344,
    "Waste": 1.7,
    "Transport": 0.21,
    "Renewable": 0.25,
    "Construction": 500.0,
    "Aircraft": 115.0
}

manual_data = {
    "GSE": 300,
    "Electricity": 4400,
    "Water": 100,
    "Waste": 52.6,
    "Transport": 3205,
    "Renewable": -1000,
    "Construction": 0.6,
    "Aircraft": 42
}

# ====== Endpoint لحساب الانبعاثات ======
@app.route('/api/total_emissions', methods=['GET'])
def total_emissions():
    breakdown = {}
    total = 0.0

    for section, amount in manual_data.items():
        emission = amount * EMISSION_FACTORS.get(section, 0)
        breakdown[section] = {"value": round(emission, 2)}
        total += emission

    for section in breakdown:
        percent = (breakdown[section]["value"] / total) * 100 if total else 0
        breakdown[section]["change"] = round(percent, 1)

    return jsonify({"total": round(total, 2), "breakdown": breakdown})

# ====== Endpoint يولّد تقرير PDF ديناميكي ======
@app.route('/api/export_offset_report', methods=['POST'])
def export_offset_report():
    data = request.json

    # البيانات المستلمة من الواجهة
    baseline = data.get('baselineEmissions', 0) / 1000  # نحوله إلى tCO2
    total_offset = data.get('totalOffset', 0)
    net = data.get('netEmissions', 0)
    reduction = data.get('reductionPercentage', 0)
    strategies = data.get('strategies', [])

    # توليد وقت التقرير
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)

    # العنوان الرئيسي
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(100, 800, "Carbon Offset Report")

    # وقت التوليد
    pdf.setFont("Helvetica", 11)
    pdf.drawString(100, 780, f"Generated on: {now}")

    # البيانات الأساسية
    pdf.setFont("Helvetica", 12)
    pdf.drawString(100, 750, f"Total Emissions: {baseline:.1f} tCO2e")
    pdf.drawString(100, 735, f"Total Offset: {total_offset:.1f} tCO2e")
    pdf.drawString(100, 720, f"Net Emissions: {net:.1f} tCO2e")
    pdf.drawString(100, 705, f"Reduction Achieved: {reduction:.0f}%")

    # الاستراتيجيات
    y = 680
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(100, y, "Offset Strategies:")
    y -= 20
    pdf.setFont("Helvetica", 11)

    for s in strategies:
        line = f"- {s['type']}: -{s['impact']} tCO2 ({s['percentage']}%)"
        pdf.drawString(100, y, line)
        y -= 15
        # في حال امتلأت الصفحة
        if y < 50:
            pdf.showPage()
            y = 800
            pdf.setFont("Helvetica", 11)

    pdf.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="offset-report.pdf", mimetype='application/pdf')

if __name__ == "__main__":
    app.run(debug=True)
