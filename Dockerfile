# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 as base
WORKDIR /usr/src/app

# FROM node:20-alpine AS deps
# RUN apk add --no-cache libc6-compat openssl
# WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

COPY prisma ./

RUN bun prisma generate

ENV NEXT_TELEMETRY_DISABLED 1

# COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts .
COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "server.js" ]



# RUN \
#     if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
#     elif [ -f package-lock.json ]; then npm ci; \
#     elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
#     else echo "Lockfile not found." && exit 1; \
#     fi

##### BUILDER

# FROM node:20-alpine AS builder
# ARG DATABASE_URL
# ARG NEXT_PUBLIC_CLIENTVAR
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# RUN mkdir tmp
# COPY . .

# RUN yarn prisma generate

# ENV NEXT_TELEMETRY_DISABLED 1

# RUN \
#     if [ -f yarn.lock ]; then SKIP_ENV_VALIDATION=1 yarn build; \
#     elif [ -f package-lock.json ]; then SKIP_ENV_VALIDATION=1 npm run build; \
#     elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && SKIP_ENV_VALIDATION=1 pnpm run build; \
#     else echo "Lockfile not found." && exit 1; \
#     fi

##### RUNNER

# FROM node:20-alpine AS runner
# WORKDIR /app

# ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/next.config.mjs ./
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/package.json ./package.json

# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/tmp ./tmp

# USER nextjs
# EXPOSE 3000
# ENV PORT 3000

# CMD ["node", "server.js"]