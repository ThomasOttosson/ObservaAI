import os
import re
import zipfile
import time
import json
from io import BytesIO

from dotenv import load_dotenv
from google import genai

from django.db.models import Count
from django.db.models.functions import TruncDate

from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from django.contrib.auth.models import User

from .models import Analysis

from django.http import HttpResponse

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)

from reportlab.lib.styles import getSampleStyleSheet

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


@api_view(["GET"])
def api_root(request):
    return Response({"message": "API is running"})


@api_view(["GET"])
def health(request):
    return Response(
        {
            "status": "ok",
            "message": "Django AI Assistant is running",
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def history(request):
    analyses = Analysis.objects.filter(user=request.user).order_by("-created_at")[:20]

    return Response(
        [
            {
                "id": analysis.id,
                "prompt": analysis.prompt,
                "response": analysis.response,
                "favorite": analysis.favorite,
            }
            for analysis in analyses
        ]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    analyses = Analysis.objects.filter(user=request.user)

    code_analyses = analyses.filter(
        architecture_score__isnull=False,
        performance_score__isnull=False,
        production_score__isnull=False,
    )

    analyses_per_day = (
        analyses.annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    )

    chart_data = [
        {
            "day": item["day"].strftime("%Y-%m-%d"),
            "total": item["total"],
        }
        for item in analyses_per_day
    ]

    latest = analyses.order_by("-created_at").first()

    score_history = [
        {
            "date": analysis.created_at.strftime("%Y-%m-%d"),
            "architecture": analysis.architecture_score,
            "security": analysis.security_score,
            "performance": analysis.performance_score,
            "production": analysis.production_score,
            "response_time": analysis.response_time,
        }
        for analysis in code_analyses.order_by("created_at")
    ]

    total_count = analyses.count()
    code_count = code_analyses.count()

    favorite_count = analyses.filter(favorite=True).count()

    total_lines_analyzed = sum(a.lines_of_code or 0 for a in analyses)

    avg_response_time = (
        round(
            sum(a.response_time or 0 for a in analyses) / total_count,
            2,
        )
        if total_count
        else 0
    )

    avg_architecture = (
        round(
            sum(a.architecture_score or 0 for a in code_analyses) / code_count,
            1,
        )
        if code_count
        else 0
    )

    avg_security = (
        round(
            sum(a.security_score or 0 for a in code_analyses) / code_count,
            1,
        )
        if code_count
        else 0
    )

    avg_performance = (
        round(
            sum(a.performance_score or 0 for a in code_analyses) / code_count,
            1,
        )
        if code_count
        else 0
    )

    avg_production = (
        round(
            sum(a.production_score or 0 for a in code_analyses) / code_count,
            1,
        )
        if code_count
        else 0
    )

    return Response(
        {
            "total_analyses": total_count,
            "favorite_analyses": favorite_count,
            "latest_analysis": (latest.created_at if latest else None),
            "analyses_per_day": chart_data,
            "average_scores": {
                "architecture": avg_architecture,
                "security": avg_security,
                "performance": avg_performance,
                "production": avg_production,
                "observability": "-",
                "reliability": "-",
                "severity": "-",
            },
            "total_incidents": 0,
            "score_history": score_history,
            "total_lines_analyzed": total_lines_analyzed,
            "avg_response_time": avg_response_time,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, analysis_id):
    try:
        analysis = Analysis.objects.get(id=analysis_id, user=request.user)

        analysis.favorite = not analysis.favorite
        analysis.save()

        return Response({"favorite": analysis.favorite})

    except Analysis.DoesNotExist:
        return Response(
            {"error": "Analysis not found"},
            status=404,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_pdf(request, analysis_id):

    try:
        analysis = Analysis.objects.get(id=analysis_id, user=request.user)

        response = HttpResponse(content_type="application/pdf")

        response["Content-Disposition"] = (
            f'attachment; filename="analysis_{analysis.id}.pdf"'
        )

        doc = SimpleDocTemplate(response)

        styles = getSampleStyleSheet()

        content = []

        content.append(
            Paragraph(
                "Django AI Analysis Report",
                styles["Title"],
            )
        )

        content.append(Spacer(1, 20))

        content.append(
            Paragraph(
                f"Prompt: {analysis.prompt}",
                styles["Heading2"],
            )
        )

        content.append(Spacer(1, 10))

        content.append(
            Paragraph(
                analysis.response.replace("\n", "<br/>"),
                styles["BodyText"],
            )
        )

        doc.build(content)

        return response

    except Analysis.DoesNotExist:

        return Response(
            {"error": "Analysis not found"},
            status=404,
        )


@api_view(["POST"])
def register(request):

    username = request.data.get("username")
    password = request.data.get("password")

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "User already exists"},
            status=400,
        )

    User.objects.create_user(
        username=username,
        password=password,
    )

    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):

    return Response(
        {
            "username": request.user.username,
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_analysis(request, analysis_id):
    try:
        analysis = Analysis.objects.get(id=analysis_id, user=request.user)
        analysis.delete()

        return Response({"success": True})

    except Analysis.DoesNotExist:
        return Response(
            {"success": False, "error": "Analysis not found"},
            status=404,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat(request):

    if client is None:
        return Response(
            {
                "reply": "AI service is not configured yet. Please add GEMINI_API_KEY on the backend.",
                "incident_data": None,
            },
            status=503,
        )

    message = request.data.get("message", "").strip()
    analysis_mode = request.data.get("analysis_mode", "security")

    uploaded_files = request.FILES.getlist("files")

    all_files_content = ""

    for uploaded_file in uploaded_files:
        try:

            if uploaded_file.name.lower().endswith(".zip"):

                zip_data = BytesIO(uploaded_file.read())

                with zipfile.ZipFile(zip_data) as z:

                    for filename in z.namelist():

                        if filename.endswith(
                            (
                                ".py",
                                ".txt",
                                ".md",
                                ".json",
                                ".html",
                                ".css",
                                ".js",
                                ".jsx",
                                ".tsx",
                                ".log",
                            )
                        ):
                            try:
                                file_content = z.read(filename).decode("utf-8")

                                all_files_content += f"""

FILE: {filename}

{file_content}

============================================================

"""

                            except Exception:
                                pass

            else:

                content = uploaded_file.read().decode("utf-8")

                all_files_content += f"""

FILE: {uploaded_file.name}

{content}

============================================================

"""

        except Exception:
            pass

    if not message and not all_files_content:
        return Response({"reply": "Please enter a message or upload files."})

    try:

        MAX_CHARS = 50000

        if len(all_files_content) > MAX_CHARS:
            all_files_content = all_files_content[:MAX_CHARS]

        is_log_analysis = analysis_mode == "security"

        if is_log_analysis:
            prompt = f"""
You are a senior Site Reliability Engineer and Splunk Incident Analyst.

Analyze the following logs and return ONLY valid JSON.

IMPORTANT:

observability must be an integer between 0 and 10
security must be an integer between 0 and 10
reliability must be an integer between 0 and 10

Do NOT return values above 10.

User Message:
{message}

Logs and Files:
{all_files_content}

Return exactly this JSON structure:

{{
  "incident_scores": {{
    "observability": 0,
    "security": 0,
    "reliability": 0,
    "severity": "Low/Medium/High/Critical"
  }},
  "summary": "",
  "root_cause": {{
    "cause": "",
    "impact": "",
    "severity": "",
    "fix": ""
  }},
  "timeline": [
    {{
      "time": "",
      "event": ""
    }}
  ],
  "affected_services": [
    {{
      "name": "",
      "status": "healthy/degraded/down"
    }}
  ],
  "splunk_queries": [],
  "runbook_steps": [],
  "business_impact": {{
    "affectedUsers": "",
    "affectedEndpoint": "",
    "estimatedDowntime": "",
    "risk": ""
  }},
  "mttr_estimate": {{
    "current": "",
    "target": "",
    "improvement": ""
  }}
}}
"""
        else:
            prompt = f"""
You are a senior software architect and code reviewer.

Responsibilities:

- Review code in any programming language
- Find bugs
- Suggest improvements
- Recommend best practices
- Improve database design
- Improve API design
- Find security issues
- Suggest performance optimizations
- Review project structure

User Message:

{message}

Project Files:

{all_files_content}

Instructions:

If multiple files are provided:

1. Analyze project architecture
2. Detect missing serializers
3. Detect missing URLs
4. Detect security issues
5. Detect performance issues
6. Suggest improvements
7. Suggest folder structure
8. Suggest production readiness improvements

Return your analysis in exactly this format:

# Project Scores

Architecture: X/10
Security: X/10
Performance: X/10
Production Readiness: X/10

# Summary

Write a summary.

# Problems Found

List all problems.

# Improvements

List all improvements.

# Improved Code

Provide improved code if relevant.

IMPORTANT:
Always wrap code examples in markdown code blocks with the correct language.
For example, use markdown code blocks with language tags such as python, javascript, java, csharp, sql, etc.
"""

        start_time = time.time()

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        response_time = round(
            time.time() - start_time,
            2,
        )

        reply = response.text

        incident_data = None

        if is_log_analysis:
            try:
                incident_data = json.loads(reply)
            except Exception as e:
                print("JSON ERROR:", e)

        architecture = re.search(
            r"Architecture:\s*(\d+)/10",
            reply,
        )

        security = re.search(
            r"Security:\s*(\d+)/10",
            reply,
        )

        performance = re.search(
            r"Performance:\s*(\d+)/10",
            reply,
        )

        production = re.search(
            r"Production Readiness:\s*(\d+)/10",
            reply,
        )

        Analysis.objects.create(
            user=request.user,
            prompt=(message if message else "File analysis"),
            response=reply,
            architecture_score=(int(architecture.group(1)) if architecture else None),
            security_score=(int(security.group(1)) if security else None),
            performance_score=(int(performance.group(1)) if performance else None),
            production_score=(int(production.group(1)) if production else None),
            files_count=len(uploaded_files),
            lines_of_code=len(all_files_content.splitlines()),
            response_time=response_time,
        )

        return Response(
            {
                "reply": reply,
                "incident_data": incident_data,
            }
        )

    except Exception as e:
        error_message = str(e)

        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            return Response(
                {
                    "reply": "AI quota reached. Please wait a minute and try again.",
                    "incident_data": None,
                },
                status=429,
            )

        return Response(
            {
                "reply": f"Gemini error: {error_message}",
                "incident_data": None,
            },
            status=500,
        )
