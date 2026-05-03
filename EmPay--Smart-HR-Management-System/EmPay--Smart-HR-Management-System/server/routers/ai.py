"""
AI Integration router for EmPay using Groq API
Endpoints: POST /api/ai/suggest
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os
from typing import Optional

from ..config.database import get_db
from ..models import User
from ..schemas import AIRequest, AIResponse
from ..dependencies import get_current_user
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama3-8b-8192"

# System prompts for different AI types (from EmPay_Hackathon_Plan_Updated.pdf)
SYSTEM_PROMPTS = {
    "leave": "You are an HR assistant. Return only a professional leave reason in 1-2 sentences.",

    "summary": "You are a payroll analyst. Return exactly 2 sentences summarising the data.",

    "insight": "You are an HR analytics bot. Return 1 insight sentence only.",
}


async def call_groq_api(messages: list) -> Optional[str]:
    """
    Call Groq API with error handling

    Args:
        messages: List of message objects for the API

    Returns:
        Response text from Groq API or None if error
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set GROQ_API_KEY in environment.",
        )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content")

            elif response.status_code == 429:
                # Rate limit hit
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI service rate limit exceeded. Please try again later.",
                )

            elif response.status_code == 401:
                # Invalid API key
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service authentication failed. Please contact administrator.",
                )

            else:
                # Other errors
                error_detail = response.text if response.text else f"Status {response.status_code}"
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"AI service error: {error_detail}",
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service request timed out. Please try again.",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to AI service: {str(e)}",
        )


@router.post("/suggest", response_model=AIResponse)
async def get_ai_suggestion(
    request: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-generated suggestions, summaries, or insights

    Supports three types:
    1. leave - Analyze leave requests for approval recommendation
    2. summary - Generate HR data summaries
    3. insight - Generate insights from HR data

    Args:
        request: AI request with type and context data
        db: Database session
        current_user: Current authenticated user

    Returns:
        AIResponse with success status and AI-generated content

    Error Handling:
    - Returns graceful error responses if API is unavailable
    - Rate limiting errors are handled gracefully
    - Service errors don't crash the UI
    """

    # Validate request type
    if request.type not in SYSTEM_PROMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AI type. Must be one of: {', '.join(SYSTEM_PROMPTS.keys())}",
        )

    try:
        # Prepare the user message based on type
        if request.type == "leave":
            user_message = f"""Analyze this leave request:
            - Type: {request.data.get('leave_type', 'Unknown')}
            - Duration: {request.data.get('start_date', 'N/A')} to {request.data.get('end_date', 'N/A')}
            - Reason: {request.data.get('reason', 'No reason provided')}
            - Days Requested: {request.data.get('days_requested', 'Unknown')}

            Provide a brief assessment and recommendation."""

        elif request.type == "summary":
            user_message = f"""Generate a summary of the following HR data:
            {request.data}

            Keep it concise and focus on key metrics."""

        elif request.type == "insight":
            user_message = f"""Analyze the following data and provide insights:
            {request.data}

            Look for patterns, trends, and actionable recommendations."""

        else:
            user_message = str(request.data)

        # Call Groq API
        system_prompt = SYSTEM_PROMPTS.get(request.type, "You are a helpful HR assistant.")

        messages = [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_message,
            },
        ]

        response_text = await call_groq_api(messages)

        if response_text:
            return AIResponse(
                success=True,
                message="AI suggestion generated successfully",
                data={"suggestion": response_text},
            )
        else:
            return AIResponse(
                success=False,
                message="Failed to generate AI suggestion",
                error="No response from AI service",
            )

    except HTTPException:
        # Re-raise HTTP exceptions from call_groq_api
        raise

    except Exception as e:
        # Catch any unexpected errors and return graceful response
        return AIResponse(
            success=False,
            message="Error generating AI suggestion",
            error=f"An unexpected error occurred: {str(e)}",
        )


@router.get("/health")
async def check_ai_service():
    """
    Check if AI service is available

    Returns:
        Status of the AI service connection
    """
    if not GROQ_API_KEY:
        return {
            "status": "unconfigured",
            "message": "AI service not configured (GROQ_API_KEY not set)",
        }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1,
                },
            )

            if response.status_code in [200, 400]:  # 400 if prompt is too short, but API works
                return {
                    "status": "healthy",
                    "message": "AI service is available",
                }
            elif response.status_code == 401:
                return {
                    "status": "authentication_failed",
                    "message": "Invalid or expired API key",
                }
            elif response.status_code == 429:
                return {
                    "status": "rate_limited",
                    "message": "API rate limit exceeded",
                }
            else:
                return {
                    "status": "error",
                    "message": f"API returned status {response.status_code}",
                }

    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "message": "AI service connection timeout",
        }
    except httpx.RequestError as e:
        return {
            "status": "unreachable",
            "message": f"Cannot reach AI service: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
        }
