from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

#from app.db.create_admin import create_admin

from app.routers.auth import router as auth_router

from app.db.database import engine
from app.routers.admin import router as admin_router

from app.routers.academic_sections import router as academic_sections_router
from app.routers.subjects import router as subjects_router

from app.routers.students import router as students_router
from app.routers.teachers import router as teachers_router

from app.routers.attendance import router as attendance_router
from app.routers.results import router as results_router
from app.routers.assessments import router as assessments_router

from app.routers.teacher_assignments import (
    router as teacher_assignments_router,
)


app = FastAPI(
    title="Attendance & Result Management System",
    version="1.0.0"
)
#for admin creation
# "@app.on_event("startup")
# def startup_event():
#     create_default_admin()"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)

app.include_router(academic_sections_router)
app.include_router(subjects_router)

app.include_router(students_router)
app.include_router(teachers_router)

app.include_router(teacher_assignments_router)

app.include_router(attendance_router)
app.include_router(results_router)
app.include_router(assessments_router)

@app.get("/")
def root():
    return {
        "message": "Attendance & Result Management System API",
        "status": "running"
    }


@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "result": value
    }