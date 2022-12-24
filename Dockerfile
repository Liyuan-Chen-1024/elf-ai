FROM python:3.11

# Create app directory
WORKDIR /app

RUN apt-get update && apt-get install -y g++ gcc libxml2 cron libxslt-dev default-mysql-client
RUN python -m pip install --upgrade pip

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY . .

COPY crontab /etc/cron.d/cool-jarvis
RUN chmod 0644 /etc/cron.d/cool-jarvis && crontab /etc/cron.d/cool-jarvis

EXPOSE 8000

CMD ["tail", "-f", "/dev/null"]
