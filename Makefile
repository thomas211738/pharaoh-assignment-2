# Define your virtual environment and flask app
# Install dependencies
install:
	cd frontend && npm install
	
# Run the Flask application
run:
	cd frontend && npm run dev

