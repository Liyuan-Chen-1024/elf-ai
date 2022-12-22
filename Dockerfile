FROM python:3.11

# Create app directory
WORKDIR /app

# Install NPM and Node
RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm
RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

RUN apt-get update && apt-get install -y g++ gcc libxml2 cron libxslt-dev python-dev default-libmysqlclient-de
RUN python -m pip install --upgrade pip

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY . .

# Setup SSH with secure root login
RUN apt-get update \
 && apt-get install -y openssh-server netcat \
 && mkdir /var/run/sshd \
 && echo 'root:password' | chpasswd \
 && sed -i 's/\#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

EXPOSE 22
EXPOSE 8000
CMD ["/usr/sbin/sshd", "-D"]
