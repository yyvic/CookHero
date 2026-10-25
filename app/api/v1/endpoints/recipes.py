"""菜谱浏览只读接口。

HowToCook 菜谱库完整落在 knowledge_documents 表（data_source = recipes）中，
原项目只能通过 AI 对话间接访问菜谱。这里补一组只读接口，
让移动端 / 桌面端可以直接浏览、搜索、筛选全部菜谱，不依赖大模型。
"""

import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import case, func, or_, select

from app.database.models import KnowledgeDocumentModel
from app.database.session import get_session_context

logger = logging.getLogger(__name__)
router = APIRouter()

GLOBAL_SOURCE = "recipes"
EXCERPT_LEN = 120
EXCLUDED_CATEGORIES = ("索引",)


def _to_uuid(value: Optional[str]):
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return None


def _make_excerpt(content: str) -> str:
    """取正文前若干字符作为摘要，去掉 markdown 标题符号。"""
    if not content:
        return ""
    text = content.strip()
    lines = [ln for ln in text.split("\n") if ln.strip()]
    body = [ln.strip() for ln in lines if not ln.strip().startswith("# ")]
    flat = " ".join(body)
    flat = flat.replace("#", "").replace("*", "").replace("`", "").strip()
    return flat[:EXCERPT_LEN]


def _brief(doc: KnowledgeDocumentModel) -> dict:
    return {
        "id": str(doc.id),
        "dish_name": doc.dish_name,
        "category": doc.category,
        "difficulty": doc.difficulty,
        "excerpt": _make_excerpt(doc.content),
    }


def _base_conditions() -> list:
    return [
        KnowledgeDocumentModel.data_source == GLOBAL_SOURCE,
        KnowledgeDocumentModel.category.notin_(EXCLUDED_CATEGORIES),
    ]


@router.get("/recipes/filters")
async def get_recipe_filters():
    """返回菜谱的分类与难度选项，以及各选项下的数量。"""
    async with get_session_context() as session:
        cat_rows = (
            await session.execute(
                select(KnowledgeDocumentModel.category, func.count())
                .where(*_base_conditions())
                .group_by(KnowledgeDocumentModel.category)
                .order_by(func.count().desc())
            )
        ).all()
        diff_rows = (
            await session.execute(
                select(KnowledgeDocumentModel.difficulty, func.count())
                .where(*_base_conditions())
                .group_by(KnowledgeDocumentModel.difficulty)
                .order_by(func.count().desc())
            )
        ).all()

    return {
        "categories": [{"value": c, "count": n} for c, n in cat_rows],
        "difficulties": [{"value": d, "count": n} for d, n in diff_rows],
    }


@router.get("/recipes/random")
async def random_recipes(limit: int = Query(3, ge=1, le=30)):
    """随机推荐若干道菜（"今天吃什么"）。"""
    async with get_session_context() as session:
        rows = (
            await session.execute(
                select(KnowledgeDocumentModel)
                .where(*_base_conditions())
                .order_by(func.random())
                .limit(limit)
            )
        ).scalars().all()
    return {"items": [_brief(d) for d in rows], "total": len(rows)}


@router.get("/recipes")
async def list_recipes(
    keyword: Optional[str] = Query(None, description="菜名关键字或正文关键字"),
    category: Optional[str] = Query(None, description="按分类筛选"),
    difficulty: Optional[str] = Query(None, description="按难度筛选"),
    limit: int = Query(24, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """分页浏览/搜索公共菜谱库，不调用大模型。"""
    conditions = _base_conditions()
    if category:
        conditions.append(KnowledgeDocumentModel.category == category)
    if difficulty:
        conditions.append(KnowledgeDocumentModel.difficulty == difficulty)

    # 菜名命中的排前面，否则搜「番茄」第一条会是正文里偶然提到番茄的其它菜
    order_by = [KnowledgeDocumentModel.dish_name.asc()]
    if keyword:
        kw = "%" + keyword.strip() + "%"
        conditions.append(
            or_(
                KnowledgeDocumentModel.dish_name.ilike(kw),
                KnowledgeDocumentModel.content.ilike(kw),
            )
        )
        order_by.insert(0, case((KnowledgeDocumentModel.dish_name.ilike(kw), 0), else_=1))

    async with get_session_context() as session:
        total = (
            await session.execute(select(func.count()).where(*conditions))
        ).scalar() or 0
        rows = (
            await session.execute(
                select(KnowledgeDocumentModel)
                .where(*conditions)
                .order_by(*order_by)
                .limit(limit)
                .offset(offset)
            )
        ).scalars().all()
        items = [_brief(d) for d in rows]

    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str):
    """获取单个菜谱的完整正文。"""
    rid = _to_uuid(recipe_id)
    if rid is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="菜谱 ID 格式不正确"
        )

    async with get_session_context() as session:
        doc = (
            await session.execute(
                select(KnowledgeDocumentModel).where(
                    KnowledgeDocumentModel.id == rid,
                    KnowledgeDocumentModel.data_source == GLOBAL_SOURCE,
                )
            )
        ).scalars().first()

    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="菜谱不存在"
        )

    return {
        "id": str(doc.id),
        "dish_name": doc.dish_name,
        "category": doc.category,
        "difficulty": doc.difficulty,
        "source": doc.source,
        "content": doc.content,
    }
