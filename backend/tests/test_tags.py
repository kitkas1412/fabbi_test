"""Database regressions for the Tag and Todo-to-Tag schema."""

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.tag import Tag, todo_tags
from app.models.todo import Todo
from app.models.user import User


@pytest.mark.asyncio(loop_scope="session")
async def test_tag_names_are_case_insensitively_unique_per_user(db_session):
    """A user cannot create two tags whose names differ only by casing."""
    owner = User(email="tag-owner@example.com", hashed_password="hash")
    other_user = User(email="tag-other@example.com", hashed_password="hash")
    db_session.add_all([owner, other_user])
    await db_session.commit()
    other_user_id = other_user.id

    db_session.add(Tag(user_id=owner.id, name="Work", color="#2563eb"))
    await db_session.commit()

    db_session.add(Tag(user_id=owner.id, name="work"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()

    db_session.add(Tag(user_id=other_user_id, name="WORK"))
    await db_session.commit()


@pytest.mark.asyncio(loop_scope="session")
async def test_todo_tag_mapping_rejects_duplicate_pairs(db_session):
    """The composite primary key allows a Tag to be applied only once per Todo."""
    user = User(email="mapping-owner@example.com", hashed_password="hash")
    todo = Todo(title="Tagged Todo", user=user)
    tag = Tag(user=user, name="Important")
    db_session.add_all([user, todo, tag])
    await db_session.commit()

    mapping = {"todo_id": todo.id, "tag_id": tag.id}
    await db_session.execute(todo_tags.insert().values(**mapping))
    await db_session.commit()

    with pytest.raises(IntegrityError):
        await db_session.execute(todo_tags.insert().values(**mapping))
        await db_session.commit()
    await db_session.rollback()


def test_tag_and_todo_filtering_indexes_are_declared():
    """Schema metadata must retain the indexes used by Tag and Todo queries."""
    tag_indexes = {index.name for index in Tag.__table__.indexes}
    mapping_indexes = {index.name for index in todo_tags.indexes}
    todo_indexes = {index.name for index in Todo.__table__.indexes}

    assert {"ix_tags_user_id", "uq_tags_user_id_lower_name"} <= tag_indexes
    assert {"ix_todo_tags_todo_id", "ix_todo_tags_tag_id"} <= mapping_indexes
    assert "ix_todos_user_id_completed_created_at_id" in todo_indexes
