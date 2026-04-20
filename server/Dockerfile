FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js agent-prompts.js normalize-schema.js transform-fields.js auth-middleware.js provision-tenant.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY services/ ./services/

EXPOSE 4000

CMD ["node", "index.js"]
