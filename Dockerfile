FROM node:slim as builder
LABEL maintainer="IITII <ccmejx@gmail.com>"
COPY . /telegraph_downloader
WORKDIR /telegraph_downloader
RUN npm i && \
apt clean
CMD ["npm","start"]