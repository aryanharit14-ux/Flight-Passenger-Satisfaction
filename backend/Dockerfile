FROM python:3.12-slim

# 1. Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# 2. Switch to the "user" user
USER user

# 3. Set home and path environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 4. Set the working directory to the user's home directory
WORKDIR $HOME/app

# 5. Copy requirements and install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the source code
COPY --chown=user . .

# 7. Expose the standard Hugging Face port
EXPOSE 7860

# 8. Command to run Gunicorn on port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "120", "app:app"]
