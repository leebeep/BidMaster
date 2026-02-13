from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.services.duplicate_service import DuplicateService
import uuid
import asyncio

class DuplicateParams(BaseModel):
    min_length: int = 10
    split_words: str = "。|:|：|,|，"

class DuplicateResult(BaseModel):
    task_id: str
    status: str
    results: Optional[List[dict]] = None

def create_router(duplicate_service: DuplicateService):
    router = APIRouter(prefix="/duplicate", tags=["标书查重"])

    @router.post("/upload", response_model=DuplicateResult)
    async def upload_files(
        background_tasks: BackgroundTasks,
        bid_files: List[UploadFile] = File(...),
        min_length: int = Form(10),
        split_words: str = Form("。|:|：|,|，")
    ):
        task_id = str(uuid.uuid4())
        params = DuplicateParams(min_length=min_length, split_words=split_words)
        
        bid_file_contents = []
        for f in bid_files:
            content = await f.read()
            bid_file_contents.append({
                "filename": f.filename,
                "content": content
            })
        
        background_tasks.add_task(
            duplicate_service.check_duplicate_with_content, 
            task_id, 
            bid_file_contents, 
            params
        )
        
        return DuplicateResult(task_id=task_id, status="processing")

    @router.get("/result/{task_id}", response_model=DuplicateResult)
    async def get_result(task_id: str):
        # 查询任务状态和结果
        result = duplicate_service.get_result(task_id)
        return result
    
    return router