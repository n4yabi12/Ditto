FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    curl build-essential pkg-config \
    libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
    libxdo-dev wget file nodejs npm && \
    npm install -g n && n 20 && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app
