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

#COPY cronjobs /etc/cron.d/jarvis-cronjobs
#RUN chmod 0644 /etc/cron.d/jarvis-cronjobs && crontab /etc/cron.d/jarvis-cronjobs
RUN crontab cronjobs
RUN touch /var/log/cron.log

EXPOSE 8000

CMD ["tail", "-f", "/dev/null"]
