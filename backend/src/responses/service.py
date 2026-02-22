import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.enums import ResponseStatus
from src.core.exceptions import BadRequestError, NotFoundError
from src.forms.models import Form, Question
from src.organizations.models import Node, User
from src.responses.conformity import check_conformity
from src.responses.models import Answer, Response
from src.responses.schemas import AnswerUpsert, ResponseCreate, ResponseResponse


async def create_response(
    db: AsyncSession,
    form_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ResponseCreate,
) -> Response:
    # Verify form exists and is published
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalar_one_or_none()
    if not form:
        raise NotFoundError("Form not found")
    if not form.is_published:
        raise BadRequestError("Form is not published")

    response = Response(
        form_id=form_id,
        node_id=data.node_id,
        respondent_id=user_id,
        parent_response_id=data.parent_response_id,
        status=ResponseStatus.DRAFT,
        started_at=datetime.now(timezone.utc),
        device_id=data.device_id,
        client_created_at=data.client_created_at,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(response)
    await db.flush()
    return response


async def get_response(db: AsyncSession, response_id: uuid.UUID) -> Response:
    result = await db.execute(
        select(Response)
        .options(selectinload(Response.answers))
        .where(Response.id == response_id)
    )
    response = result.scalar_one_or_none()
    if not response:
        raise NotFoundError("Response not found")
    return response


async def list_responses(
    db: AsyncSession,
    org_id: uuid.UUID,
    form_id: uuid.UUID | None = None,
    node_id: uuid.UUID | None = None,
    respondent_id: uuid.UUID | None = None,
    status: ResponseStatus | None = None,
) -> list[ResponseResponse]:
    query = (
        select(Response, Form.title, Node.name, User.full_name)
        .join(Form, Response.form_id == Form.id)
        .join(Node, Response.node_id == Node.id)
        .join(User, Response.respondent_id == User.id)
        .where(Form.organization_id == org_id)
    )
    if form_id:
        query = query.where(Response.form_id == form_id)
    if node_id:
        query = query.where(Response.node_id == node_id)
    if respondent_id:
        query = query.where(Response.respondent_id == respondent_id)
    if status:
        query = query.where(Response.status == status)
    query = query.order_by(Response.created_at.desc())
    result = await db.execute(query)
    rows = result.all()
    return [
        ResponseResponse(
            id=row.Response.id,
            form_id=row.Response.form_id,
            node_id=row.Response.node_id,
            respondent_id=row.Response.respondent_id,
            parent_response_id=row.Response.parent_response_id,
            status=row.Response.status,
            started_at=row.Response.started_at,
            submitted_at=row.Response.submitted_at,
            device_id=row.Response.device_id,
            created_at=row.Response.created_at,
            form_title=row.title,
            node_name=row.name,
            respondent_name=row.full_name,
        )
        for row in rows
    ]


async def upsert_answers(
    db: AsyncSession,
    response_id: uuid.UUID,
    answers_data: list[AnswerUpsert],
) -> list[Answer]:
    response = await get_response(db, response_id)
    if response.status == ResponseStatus.SUBMITTED:
        raise BadRequestError("Cannot modify a submitted response")

    now = datetime.now(timezone.utc)
    results = []

    for answer_data in answers_data:
        # Get question for conformity check
        q_result = await db.execute(
            select(Question).where(Question.id == answer_data.question_id)
        )
        question = q_result.scalar_one_or_none()
        if not question:
            continue

        # Check conformity
        conformity = check_conformity(
            question.question_type, answer_data.value, question.reference_value
        )

        # Upsert answer
        existing = await db.execute(
            select(Answer).where(
                Answer.response_id == response_id,
                Answer.question_id == answer_data.question_id,
            )
        )
        answer = existing.scalar_one_or_none()

        if answer:
            answer.value = answer_data.value
            answer.comment = answer_data.comment
            answer.conformity_status = conformity
            answer.answered_at = now
            answer.client_created_at = answer_data.client_created_at
        else:
            answer = Answer(
                response_id=response_id,
                question_id=answer_data.question_id,
                value=answer_data.value,
                comment=answer_data.comment,
                conformity_status=conformity,
                answered_at=now,
                client_created_at=answer_data.client_created_at,
            )
            db.add(answer)
            await db.flush()

        results.append(answer)

    # Update response status
    if response.status == ResponseStatus.DRAFT:
        response.status = ResponseStatus.IN_PROGRESS

    await db.flush()
    return results


async def submit_response(db: AsyncSession, response_id: uuid.UUID) -> Response:
    response = await get_response(db, response_id)
    if response.status == ResponseStatus.SUBMITTED:
        raise BadRequestError("Already submitted")

    response.status = ResponseStatus.SUBMITTED
    response.submitted_at = datetime.now(timezone.utc)
    return response
