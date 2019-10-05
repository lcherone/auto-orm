FROM node:lts-slim

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Configure apt and install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends apt-utils 2>&1 \
    && apt-get -y install --no-install-recommends apt-transport-https 2>&1 \
    #
    # install common
    && apt-get install -y wget curl lsb-release git procps net-tools nano htop \
    #
    # mySQL client
    && apt-get install -y mysql-client \
    #
    # npm
    && npm config set ignore-scripts false \
    # install global npm packages
    && npm install -g eslint \
    #&& npm install -g nodemon \
    #&& npm install -g pm2 \
    #
    # Clean up
    && apt-get autoremove -y && apt-get autoclean -y && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog

# Create volumn link to current directory
VOLUME /var/www/html

# Set environment vars
ENV TZ Europe/London

COPY entrypoint.sh /

#
ENTRYPOINT ["/entrypoint.sh"]

# comment out if you dont want to use .devcontainer
#CMD npm run dev
