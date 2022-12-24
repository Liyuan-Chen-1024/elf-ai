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

RUN crontab -l | { cat; echo "*/5 * * * * cd /app && python manage.py fetch_tv_shows --settings=core.settings_prod "; } | crontab -
RUN crontab -l | { cat; echo "* */2 * * * cd /app && python manage.py manage_tx_queue --settings=core.settings_prod "; } | crontab -

# Setup SSH with secure root login
RUN apt-get update \
 && apt-get install -y openssh-server netcat \
 && mkdir /var/run/sshd \
 && echo 'root:password' | chpasswd \
 && sed -i 's/\#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

EXPOSE 22
EXPOSE 8000
