from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.modules.model import Module
from app.modules.schema import ModuleCreate, ModuleUpdate
from app.groups.model import Group

def list_modules(db: Session, include_inactive: bool = False,) -> list:

    #Count groups per module_code 
    group_count_sq = (
        db.query(
            Group.module_code,
            func.count(Group.id).label("group_count"),
        )
        .group_by(Group.module_code)
        .subquery()
    )

    query = (
        db.query(Module, func.coalesce(group_count_sq.c.group_count, 0).label("group_count"))
        .outerjoin(group_count_sq, Module.code == group_count_sq.c.module_code)
    )

    if not include_inactive:
        query = query.filter(Module.is_active == True)

    rows = query.order_by(Module.code).all()

    results = []
    for module, count in rows:
        module.groups = count
        results.append(module)
    return results

def get_module(module_id: int, db: Session) -> Module:
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module

def create_module(data: ModuleCreate, db: Session) -> Module:

    existing = db.query(Module).filter(Module.code == data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Module with code '{data.code}' already exists",
        )

    module = Module(code=data.code, name=data.name)
    db.add(module)
    db.commit()
    db.refresh(module)
    module.groups = 0
    return module

def update_module(module_id: int, data: ModuleUpdate, db: Session) -> Module:
    module = get_module(module_id, db)

    if data.name is not None:
        module.name = data.name
    if data.is_active is not None:
        module.is_active = data.is_active

    db.commit()
    db.refresh(module)

    # Retach group count
    from sqlalchemy import func
    count = (
        db.query(func.count(Group.id))
        .filter(Group.module_code == module.code)
        .scalar()
    )
    module.groups = count or 0
    return module

def delete_module(module_id: int, db: Session) -> None:

    module = get_module(module_id, db)

    group_count = (
        db.query(func.count(Group.id))
        .filter(Group.module_code == module.code)
        .scalar()
    )

    if group_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot delete '{module.code}' - {group_count} gorup(s) use it."
                f"Deactivate it instead."
            )
        )
    
    db.delete(module)
    db.commit()


           