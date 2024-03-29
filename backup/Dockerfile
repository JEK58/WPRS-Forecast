FROM alpine:latest

ARG CLOUDFLARE_ACCESS_KEY_ID
ARG CLOUDFLARE_SECRET_ACCESS_KEY
ARG CLOUDFLARE_R2_ENDPOINT

# Update packages and install rclone & postgres client
RUN apk add --no-cache rclone
RUN apk add --no-cache postgresql-client

# Setup rclone r2 config
RUN rclone config create r2 s3 provider Cloudflare access_key_id $CLOUDFLARE_ACCESS_KEY_ID secret_access_key $CLOUDFLARE_SECRET_ACCESS_KEY no_check_bucket true endpoint $CLOUDFLARE_R2_ENDPOINT --non-interactive 

WORKDIR /src

COPY crontabs/root /etc/crontabs/
COPY tasks/ /etc/cronjobs/

# Ensure the scripts are executable
RUN chmod +x /etc/cronjobs/**/*

# Run cron, and tail the primary cron log
CMD crond -f -l 8
#&& tail -f /var/log/cron.log 