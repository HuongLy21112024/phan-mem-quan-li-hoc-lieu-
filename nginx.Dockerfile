# Nginx with static files baked in
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy frontend static files
COPY apps/web/dist /usr/share/nginx/html
COPY apps/admin/dist /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
