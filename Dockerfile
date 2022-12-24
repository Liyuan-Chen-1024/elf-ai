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

ARG DJANGO_SETTINGS

RUN python manage.py migrate --settings=$DJANGO_SETTINGS
RUN python manage.py seed --settings=$DJANGO_SETTINGS

RUN crontab -l | { cat; echo "*/5 * * * * cd /app && python3 manage.py fetch_tv_shows "; } | crontab -
RUN crontab -l | { cat; echo "* */2 * * * cd /app && python3 manage.py manage_tx_queue "; } | crontab -

# Setup SSH with secure root login
RUN apt-get update \
 && apt-get install -y openssh-server netcat \
 && mkdir /var/run/sshd \
 && echo 'root:password' | chpasswd \
 && sed -i 's/\#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

EXPOSE 22
EXPOSE 8000

CMD ["/usr/sbin/sshd", "-D"]