from fastapi.middleware.cors import CORSMiddleware

# Add CORS middleware to allow React frontend to connect
def setup_cors(app):

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"], #Allow all HTTP methods
        allow_headers=["*"]  #Allow all headers
    )