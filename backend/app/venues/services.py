#venues/services.py
"""Business logic for venues."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.venues.model import Venue
from app.venues.schema import VenueCreate, VenueUpdate

def list_venues(db: Session, available_only: bool = False) -> list[Venue]:
    query = db.query(Venue)
    if available_only:
        query = query.filter(Venue.is_available == True)
    return query.order_by(Venue.name).all()

def get_venue(venue_id: int, db: Session) -> Venue:
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")
    return venue

def create_venue(data: VenueCreate, db: Session) -> Venue:
    existing = db.query(Venue).filter(Venue.name == data.name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Venue '{data.name}' already exists",
        )
    venue = Venue(name=data.name.strip(), capacity=data.capacity, is_available = data.is_available)
    db.add(venue)
    db.commit()
    return venue

def update_venue(venue_id: int, data: VenueUpdate, db: Session) -> Venue:
    venue = get_venue(venue_id, db)

    if data.name is not None:
        venue.name = data.name
    if data.capacity is not None:
        venue.capacity = data.capacity
    if data.is_available is not None:
        venue.is_available = data.is_available

    db.commit()
    db.refresh(venue)
    return venue

def delete_venue(venue_id: int, db: Session) -> None:
    venue = get_venue(venue_id, db)
    db.delete(venue)
    db.commit()