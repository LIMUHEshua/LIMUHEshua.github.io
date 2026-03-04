import os
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")
API_URL = os.getenv("WEATHER_API_URL")

# 简单内存缓存（生产环境建议使用Redis）
cache = {}
CACHE_TTL = 600  # 缓存有效期10秒（可根据需要调整）

app = FastAPI(title="天气查询", version="1.0.0")

# 挂载静态文件和模板
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

async def fetch_weather(city: str):
    """异步获取天气数据，支持缓存"""
    # 检查缓存
    now = time.time()
    if city in cache and now - cache[city]["timestamp"] < CACHE_TTL:
        return cache[city]["data"]

    params = {
        "key": API_KEY,
        "city": city,
        "extensions": "all",
        "output": "json"
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return {"error": f"请求天气服务失败: {str(e)}"}

    if data.get("status") != "1":
        return {"error": data.get("info", "无法获取天气信息")}

    result = {}

    # 实况数据
    if data.get("lives") and len(data["lives"]) > 0:
        live = data["lives"][0]
        result["now"] = {
            "city": live.get("city", "未知"),
            "weather": live.get("weather", "未知"),
            "temperature": live.get("temperature", "N/A"),
            "winddirection": live.get("winddirection", "未知"),
            "windpower": live.get("windpower", "未知"),
            "humidity": live.get("humidity", "N/A"),
            "reporttime": live.get("reporttime", "未知"),
            "is_approximate": False
        }
    else:
        # 实况缺失，尝试从预报构造近似实况
        if data.get("forecasts"):
            forecast = data["forecasts"][0]
            casts = forecast.get("casts")
            if casts and len(casts) > 0:
                first_day = casts[0]
                result["now"] = {
                    "city": forecast.get("city", city),
                    "weather": first_day.get("dayweather", "未知"),
                    "temperature": first_day.get("daytemp", "N/A"),
                    "winddirection": "未知",
                    "windpower": "未知",
                    "humidity": "N/A",
                    "reporttime": "来自当天预报",
                    "is_approximate": True
                }
                result["warning"] = f'⚠️ 城市「{city}」暂无实况，以下为当天预报近似值'
            else:
                result["error"] = f"城市「{city}」无天气数据"
        else:
            result["error"] = f"城市「{city}」无天气数据"

    # 预报数据
    if data.get("forecasts"):
        forecast = data["forecasts"][0]
        casts = forecast.get("casts")
        if casts:
            result["forecast"] = []
            for cast in casts:
                result["forecast"].append({
                    "date": cast.get("date", "未知"),
                    "dayweather": cast.get("dayweather", "未知"),
                    "nightweather": cast.get("nightweather", "未知"),
                    "daytemp": cast.get("daytemp", "N/A"),
                    "nighttemp": cast.get("nighttemp", "N/A")
                })

    # 存入缓存
    cache[city] = {"timestamp": now, "data": result}
    return result

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("weather.html", {"request": request})

@app.get("/api/weather")
async def api_weather(city: str):
    if not city:
        return JSONResponse({"error": "缺少城市参数"}, status_code=400)
    data = await fetch_weather(city)
    return JSONResponse(data)

# 可选：提供缓存统计接口（用于调试）
@app.get("/api/cache/stats")
async def cache_stats():
    return {"size": len(cache), "keys": list(cache.keys())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)