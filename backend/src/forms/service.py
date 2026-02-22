import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import BadRequestError, NotFoundError
from src.forms.models import CompositeFormChild, Form, FormNodeAssignment, Question, Section
from src.forms.schemas import (
    CompositeChildAdd,
    FormCreate,
    FormNodeAssign,
    FormUpdate,
    QuestionCreate,
    QuestionUpdate,
    ReorderItem,
    SectionCreate,
    SectionUpdate,
)


# ─── Forms ────────────────────────────────────────────────────────

async def create_form(
    db: AsyncSession, org_id: uuid.UUID, data: FormCreate, user_id: uuid.UUID
) -> Form:
    form = Form(
        organization_id=org_id,
        title=data.title,
        description=data.description,
        code=data.code,
        is_composite=data.is_composite,
        expected_frequency=data.expected_frequency,
        created_by=user_id,
    )
    db.add(form)
    await db.flush()
    return form


async def get_form(db: AsyncSession, form_id: uuid.UUID) -> Form:
    result = await db.execute(
        select(Form)
        .options(
            selectinload(Form.sections).selectinload(Section.questions),
            selectinload(Form.child_links),
            selectinload(Form.node_assignments),
        )
        .where(Form.id == form_id, Form.is_active == True)  # noqa: E712
    )
    form = result.scalar_one_or_none()
    if not form:
        raise NotFoundError("Form not found")
    return form


async def list_forms(
    db: AsyncSession,
    org_id: uuid.UUID,
    is_published: bool | None = None,
    is_composite: bool | None = None,
    search: str | None = None,
) -> list[Form]:
    query = select(Form).where(Form.organization_id == org_id, Form.is_active == True)  # noqa: E712
    if is_published is not None:
        query = query.where(Form.is_published == is_published)
    if is_composite is not None:
        query = query.where(Form.is_composite == is_composite)
    if search:
        query = query.where(Form.title.ilike(f"%{search}%"))
    query = query.order_by(Form.updated_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_form(db: AsyncSession, form_id: uuid.UUID, data: FormUpdate) -> Form:
    form = await get_form(db, form_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(form, field, value)
    return form


async def publish_form(db: AsyncSession, form_id: uuid.UUID) -> Form:
    form = await get_form(db, form_id)
    form.is_published = True
    form.published_at = datetime.now(timezone.utc)
    form.version += 1
    return form


async def duplicate_form(
    db: AsyncSession, form_id: uuid.UUID, user_id: uuid.UUID
) -> Form:
    original = await get_form(db, form_id)
    new_form = Form(
        organization_id=original.organization_id,
        title=f"{original.title} (Copy)",
        description=original.description,
        code=None,
        is_composite=original.is_composite,
        expected_frequency=original.expected_frequency,
        created_by=user_id,
    )
    db.add(new_form)
    await db.flush()

    # Copy sections and questions
    for section in original.sections:
        if not section.is_active:
            continue
        new_section = Section(
            form_id=new_form.id,
            title=section.title,
            description=section.description,
            sort_order=section.sort_order,
        )
        db.add(new_section)
        await db.flush()

        for question in section.questions:
            if not question.is_active:
                continue
            new_q = Question(
                section_id=new_section.id,
                question_type=question.question_type,
                text=question.text,
                description=question.description,
                is_required=question.is_required,
                requires_photo=question.requires_photo,
                requires_comment=question.requires_comment,
                sort_order=question.sort_order,
                config=question.config,
                reference_value=question.reference_value,
            )
            db.add(new_q)

    return new_form


async def delete_form(db: AsyncSession, form_id: uuid.UUID) -> None:
    form = await get_form(db, form_id)
    form.is_active = False


# ─── Sections ─────────────────────────────────────────────────────

async def list_sections(db: AsyncSession, form_id: uuid.UUID) -> list[Section]:
    result = await db.execute(
        select(Section)
        .options(selectinload(Section.questions))
        .where(Section.form_id == form_id, Section.is_active == True)  # noqa: E712
        .order_by(Section.sort_order)
    )
    return list(result.scalars().all())


async def create_section(
    db: AsyncSession, form_id: uuid.UUID, data: SectionCreate
) -> Section:
    # Verify form exists
    await get_form(db, form_id)
    section = Section(
        form_id=form_id,
        title=data.title,
        description=data.description,
        sort_order=data.sort_order,
    )
    db.add(section)
    await db.flush()
    await db.refresh(section, ["questions"])
    return section


async def update_section(
    db: AsyncSession, section_id: uuid.UUID, data: SectionUpdate
) -> Section:
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise NotFoundError("Section not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(section, field, value)
    return section


async def delete_section(db: AsyncSession, section_id: uuid.UUID) -> None:
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise NotFoundError("Section not found")
    section.is_active = False


async def reorder_sections(
    db: AsyncSession, form_id: uuid.UUID, items: list[ReorderItem]
) -> None:
    for item in items:
        result = await db.execute(
            select(Section).where(Section.id == item.id, Section.form_id == form_id)
        )
        section = result.scalar_one_or_none()
        if section:
            section.sort_order = item.sort_order


# ─── Questions ────────────────────────────────────────────────────

async def create_question(
    db: AsyncSession, section_id: uuid.UUID, data: QuestionCreate
) -> Question:
    result = await db.execute(select(Section).where(Section.id == section_id))
    if not result.scalar_one_or_none():
        raise NotFoundError("Section not found")

    question = Question(
        section_id=section_id,
        question_type=data.question_type,
        text=data.text,
        description=data.description,
        is_required=data.is_required,
        requires_photo=data.requires_photo,
        requires_comment=data.requires_comment,
        sort_order=data.sort_order,
        config=data.config,
        reference_value=data.reference_value,
    )
    db.add(question)
    await db.flush()
    return question


async def update_question(
    db: AsyncSession, question_id: uuid.UUID, data: QuestionUpdate
) -> Question:
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    return question


async def delete_question(db: AsyncSession, question_id: uuid.UUID) -> None:
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question not found")
    question.is_active = False


async def reorder_questions(
    db: AsyncSession, section_id: uuid.UUID, items: list[ReorderItem]
) -> None:
    for item in items:
        result = await db.execute(
            select(Question).where(Question.id == item.id, Question.section_id == section_id)
        )
        question = result.scalar_one_or_none()
        if question:
            question.sort_order = item.sort_order


# ─── Composite Forms ─────────────────────────────────────────────

async def add_child_form(
    db: AsyncSession, parent_form_id: uuid.UUID, data: CompositeChildAdd
) -> CompositeFormChild:
    parent = await get_form(db, parent_form_id)
    if not parent.is_composite:
        raise BadRequestError("Parent form is not composite")
    if data.child_form_id == parent_form_id:
        raise BadRequestError("Cannot add form as its own child")

    child = CompositeFormChild(
        parent_form_id=parent_form_id,
        child_form_id=data.child_form_id,
        sort_order=data.sort_order,
    )
    db.add(child)
    return child


async def remove_child_form(
    db: AsyncSession, parent_form_id: uuid.UUID, child_form_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(CompositeFormChild).where(
            CompositeFormChild.parent_form_id == parent_form_id,
            CompositeFormChild.child_form_id == child_form_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise NotFoundError("Child form link not found")
    await db.delete(link)


# ─── Node Assignments ────────────────────────────────────────────

async def assign_form_to_nodes(
    db: AsyncSession, form_id: uuid.UUID, data: FormNodeAssign
) -> list[uuid.UUID]:
    now = datetime.now(timezone.utc)
    for node_id in data.node_ids:
        # Check if already assigned
        result = await db.execute(
            select(FormNodeAssignment).where(
                FormNodeAssignment.form_id == form_id,
                FormNodeAssignment.node_id == node_id,
            )
        )
        if not result.scalar_one_or_none():
            db.add(FormNodeAssignment(
                form_id=form_id, node_id=node_id, created_at=now
            ))
    return data.node_ids
