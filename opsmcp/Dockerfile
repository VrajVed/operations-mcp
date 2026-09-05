FROM python:3.12-slim

# opsmcp is an implicit namespace package with no pyproject.toml — it only
# resolves imports when the repository root is on sys.path (see CLAUDE.md
# gotcha #1). WORKDIR here plays the role of the repo root inside the image.
WORKDIR /app

COPY opsmcp/requirements.txt ./opsmcp/requirements.txt
RUN pip install --no-cache-dir -r opsmcp/requirements.txt

COPY opsmcp/ ./opsmcp/

EXPOSE 3001

CMD ["python", "-m", "opsmcp.server"]
