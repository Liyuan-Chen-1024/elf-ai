FROM python:3.11

WORKDIR /app

RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    libxml2 \
    cron \
    libxslt-dev \
    default-mysql-client \
    gdb \
    make \
    ninja-build \
    rsync \
    zip

RUN python -m pip install --upgrade pip

# Install app dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Bundle app source
COPY . .

EXPOSE 8000

CMD ["tail", "-f", "/dev/null"]
