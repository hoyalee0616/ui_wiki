FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1

# ── 의존성 설치 ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 빌드 ─────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── 실행 이미지 ───────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV INQUIRIES_DATA_DIR=/app/data
ENV WHISPER_MODEL=/opt/whisper-models/ggml-small.bin
ENV PATH="/opt/demucs-venv/bin:/usr/local/bin:${PATH}"

# yt-dlp + ffmpeg + whisper.cpp + Demucs 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      cmake \
      curl \
      build-essential \
      ffmpeg \
      git \
      python3 \
      python3-venv && \
    rm -rf /var/lib/apt/lists/* && \
    python3 -m venv /opt/demucs-venv && \
    /opt/demucs-venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/demucs-venv/bin/pip install --no-cache-dir demucs && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    git clone --depth 1 https://github.com/ggerganov/whisper.cpp /tmp/whisper.cpp && \
    cd /tmp/whisper.cpp && \
    cmake -B build && \
    cmake --build build --config Release -j && \
    cp build/bin/whisper-cli /usr/local/bin/whisper-cli && \
    mkdir -p /opt/whisper-models && \
    curl -L -o /opt/whisper-models/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin && \
    rm -rf /tmp/whisper.cpp /root/.cache/pip

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
