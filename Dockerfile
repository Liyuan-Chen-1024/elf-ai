FROM python:3.11

# Create app directory
WORKDIR /app

RUN apt-get update && apt-get install -y g++ gcc libxml2 cron libxslt-dev default-mysql-client
RUN python -m pip install --upgrade pip

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

ARG ENABLE_CRON

# Bundle app source
COPY . .

RUN if [ "$ENABLE_CRON" = "1" ] ; then crontab cronjobs ; fi

EXPOSE 8000

CMD ["tail", "-f", "/dev/null"]
