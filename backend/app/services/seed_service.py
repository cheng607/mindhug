from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.knowledge_article import STATUS_PUBLISHED, KnowledgeArticle
from app.models.knowledge_category import KnowledgeCategory


def seed_knowledge(db: Session) -> None:
    if db.query(KnowledgeCategory).count() > 0:
        return

    categories = [
        KnowledgeCategory(
            category_name="情绪管理",
            description="学习识别和管理日常情绪",
            sort_order=1,
            status=1,
        ),
        KnowledgeCategory(
            category_name="焦虑缓解",
            description="缓解焦虑与压力的方法",
            sort_order=2,
            status=1,
        ),
        KnowledgeCategory(
            category_name="睡眠健康",
            description="改善睡眠质量的知识",
            sort_order=3,
            status=1,
        ),
        KnowledgeCategory(
            category_name="自我成长",
            description="个人成长与心理韧性",
            sort_order=4,
            status=1,
        ),
    ]
    db.add_all(categories)
    db.flush()

    now = datetime.now(timezone.utc)
    articles = [
        KnowledgeArticle(
            category_id=categories[0].id,
            title="如何识别自己的情绪信号",
            summary="了解情绪的身体和心理信号，是情绪管理的第一步。",
            content="<p>情绪是我们内心状态的镜子。当你感到胸口发紧、呼吸变浅时，可能是焦虑在敲门。</p>"
            "<p>试着每天花5分钟，问自己：此刻我感受到什么？</p>",
            cover_image="",
            tags="情绪管理,自我觉察",
            author_name="心语陪伴",
            read_count=128,
            status=STATUS_PUBLISHED,
            published_at=now,
        ),
        KnowledgeArticle(
            category_id=categories[1].id,
            title="5分钟呼吸放松法",
            summary="简单有效的呼吸练习，帮助你在焦虑时快速平静下来。",
            content="<p>找一个安静的地方坐下，闭上眼睛。</p>"
            "<p>吸气4秒，屏息4秒，呼气6秒。重复5次。</p>",
            cover_image="",
            tags="焦虑,放松,呼吸",
            author_name="心语陪伴",
            read_count=256,
            status=STATUS_PUBLISHED,
            published_at=now,
        ),
        KnowledgeArticle(
            category_id=categories[2].id,
            title="建立健康的睡眠仪式",
            summary="睡前仪式能告诉大脑：该休息了。",
            content="<p>固定的睡前仪式，如泡脚、阅读、冥想，能帮助身体进入休息模式。</p>"
            "<p>建议睡前1小时远离电子屏幕。</p>",
            cover_image="",
            tags="睡眠,健康",
            author_name="心语陪伴",
            read_count=89,
            status=STATUS_PUBLISHED,
            published_at=now,
        ),
        KnowledgeArticle(
            category_id=categories[3].id,
            title="感恩日记的力量",
            summary="每天记录三件好事，能显著提升幸福感。",
            content="<p>研究表明，坚持写感恩日记的人，抑郁和焦虑水平会明显下降。</p>"
            "<p>从今天起，睡前写下三件让你感恩的事。</p>",
            cover_image="",
            tags="自我成长,感恩",
            author_name="心语陪伴",
            read_count=167,
            status=STATUS_PUBLISHED,
            published_at=now,
        ),
        KnowledgeArticle(
            category_id=categories[0].id,
            title="正念冥想入门指南",
            summary="正念不是清空思绪，而是觉察当下。",
            content="<p>从每天3分钟的正念练习开始，专注于呼吸的进出。</p>",
            cover_image="",
            tags="正念,冥想",
            author_name="心语陪伴",
            read_count=203,
            status=STATUS_PUBLISHED,
            published_at=now,
        ),
    ]
    db.add_all(articles)
    db.commit()
